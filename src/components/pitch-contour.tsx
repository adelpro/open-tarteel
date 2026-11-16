'use client';

import { PitchDetector } from 'pitchy';
import { useEffect, useRef } from 'react';

import {
  clampMidi,
  correctOctave,
  decibelsFromRms,
  hzFromMidi,
  median,
  midiFromHz,
  noteName,
  OneEuroFilter,
  rms,
  voicedRuns,
} from '@/services/follow-along/pitch';
import { cn } from '@/utils';
import { ensurePitchAnalyser } from '@/utils/audio-analyser';

import styles from './follow-along.module.css';

export interface PitchContourProps {
  /** The player's <audio>. Needs crossOrigin for analysis. */
  audio: HTMLAudioElement | null;
  height?: number;
  /** Seconds of history kept to the left of the playhead. */
  windowSec?: number;
  minMidi?: number;
  maxMidi?: number;
  minClarity?: number;
  silenceRms?: number;
  /** Absolute seconds where each ayah starts, drawn as faint marks. */
  marks?: number[];
  onStats?: (stats: { hz: number | null; db: number }) => void;
  className?: string;
}

const SMOOTHING_SAMPLES = 3;
const STABLE_SEMITONES = 0.6;
const STABLE_SECONDS = 0.22;
const SILENCE_SECONDS = 0.3;
const STRONG_CLARITY = 0.93;
const LOUD_RMS = 0.12;
const TICK_COUNT = 4;

const GRID_COLOR = 'rgba(148, 163, 184, 0.18)';
const LABEL_COLOR = 'rgba(148, 163, 184, 0.75)';
const MARK_COLOR = 'rgba(210, 220, 250, 0.22)';
const SILENCE_FILL = 'rgba(148, 158, 180, 0.07)';
const PILL_SUSTAINED_FILL = 'rgba(74, 99, 230, 0.10)';
const PILL_SUSTAINED_STROKE = 'rgba(74, 99, 230, 0.45)';
const PILL_WANDER_FILL = 'rgba(245, 197, 24, 0.08)';
const PILL_WANDER_STROKE = 'rgba(201, 169, 28, 0.45)';

type Sample = {
  time: number;
  midi: number | null;
  strong: boolean;
  level: number;
};
type Box = {
  start: number;
  end: number;
  midi: number;
  kind: 'sustained' | 'wander';
};

const withAlpha = (base: string, alpha: number): string =>
  `rgba(${base}, ${alpha})`;

const BRASS = '245, 197, 24';
const SLATE = '226, 232, 240';

/**
 * Rolling pitch ribbon from the shared AudioContext.
 *
 * Direction A: one flowing band, thick and bright where the frame is strong,
 * fading toward the left so motion is visible, four hairlines instead of a
 * full grid, and a glowing playhead. Octave errors are corrected before the
 * one-euro filter so the band does not spike.
 *
 * It never creates its own context and never closes one: the player owns it.
 */
export function PitchContour({
  audio,
  height = 160,
  windowSec = 12,
  minMidi = 45,
  maxMidi = 62,
  minClarity = 0.8,
  silenceRms = 0.008,
  marks = [],
  onStats,
  className,
}: PitchContourProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statsRef = useRef(onStats);
  statsRef.current = onStats;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let frame = 0;
    let lastTime = -1;
    let analyser: AnalyserNode | null = null;
    let detector: PitchDetector<Float32Array> | null = null;
    let buffer: Float32Array<ArrayBuffer> | null = null;
    let sampleRate = 48000;
    const history: Sample[] = [];
    const recent: number[] = [];
    const smoother = new OneEuroFilter();
    let lastMidi: number | null = null;

    if (audio) {
      analyser = ensurePitchAnalyser(audio);
      if (analyser) {
        detector = PitchDetector.forFloat32Array(analyser.fftSize);
        buffer = new Float32Array(
          new ArrayBuffer(analyser.fftSize * Float32Array.BYTES_PER_ELEMENT)
        );
        sampleRate = analyser.context.sampleRate || 48000;
      }
    }

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);

    const yFor = (midi: number): number => {
      const ratio =
        (clampMidi(midi, minMidi, maxMidi) - minMidi) /
        Math.max(1, maxMidi - minMidi);
      return height - 12 - ratio * (height - 24);
    };

    const xFor = (now: number, time: number): number => {
      const usable = Math.max(1, canvas.clientWidth - 30);
      const pxPerSecond = usable / windowSec;
      return canvas.clientWidth - 1 - Math.max(0, now - time) * pxPerSecond;
    };

    const tickValues = (): number[] => {
      const span = Math.max(1, maxMidi - minMidi);
      return Array.from({ length: TICK_COUNT }, (_, index) =>
        Math.round(minMidi + (span * index) / (TICK_COUNT - 1))
      );
    };

    const collectBoxes = (): Box[] => {
      const boxes: Box[] = [];
      let run: Sample[] = [];
      const flush = () => {
        if (run.length >= 2) {
          const values = run.map((sample) => sample.midi as number);
          const low = Math.min(...values);
          const high = Math.max(...values);
          const duration = run[run.length - 1].time - run[0].time;
          if (duration >= STABLE_SECONDS && high - low <= STABLE_SEMITONES) {
            boxes.push({
              start: run[0].time,
              end: run[run.length - 1].time,
              midi: median(values) ?? values[0],
              kind: 'sustained',
            });
          } else if (duration >= STABLE_SECONDS * 1.5 && high - low <= 2) {
            boxes.push({
              start: run[0].time,
              end: run[run.length - 1].time,
              midi: median(values) ?? values[0],
              kind: 'wander',
            });
          }
        }
        run = [];
      };

      for (const sample of history) {
        if (sample.midi == null) flush();
        else run.push(sample);
      }
      flush();
      return boxes;
    };

    /** Stroke contiguous voiced runs. */
    const strokeRuns = (
      now: number,
      point: (sample: Sample) => boolean,
      gradient: CanvasGradient,
      width: number
    ) => {
      context.strokeStyle = gradient;
      context.lineWidth = width;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      let drawing = false;

      for (const sample of history) {
        if (sample.midi == null || !point(sample)) {
          drawing = false;
          continue;
        }
        const x = xFor(now, sample.time);
        const y = yFor(sample.midi);
        if (!drawing) {
          context.moveTo(x, y);
          drawing = true;
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    };

    const draw = (now: number) => {
      const width = canvas.clientWidth;
      const baseline = height - 10;
      context.clearRect(0, 0, width, height);

      // four hairlines, labels inside the plot
      context.lineWidth = 1;
      context.font = '9px system-ui, sans-serif';
      for (const midi of tickValues()) {
        const y = yFor(midi);
        context.strokeStyle = GRID_COLOR;
        context.beginPath();
        context.moveTo(28, y);
        context.lineTo(width, y);
        context.stroke();
        context.fillStyle = LABEL_COLOR;
        context.fillText(noteName(midi), 2, y + 3);
      }

      // ayah marks
      context.setLineDash([2, 4]);
      context.strokeStyle = MARK_COLOR;
      for (const mark of marks) {
        if (now - mark > windowSec || mark > now + 0.5) continue;
        const x = xFor(now, mark);
        context.beginPath();
        context.moveTo(x, 6);
        context.lineTo(x, height - 6);
        context.stroke();
      }
      context.setLineDash([]);

      // pauses: quiet stretches, dimmed rather than boxed
      let silenceStart: number | null = null;
      const paintSilence = (end: number) => {
        if (silenceStart == null) return;
        if (end - silenceStart >= SILENCE_SECONDS) {
          const x1 = xFor(now, silenceStart);
          const x2 = xFor(now, end);
          context.fillStyle = SILENCE_FILL;
          context.fillRect(x1, 6, Math.max(1, x2 - x1), height - 12);
        }
        silenceStart = null;
      };
      for (const sample of history) {
        if (sample.midi == null) silenceStart ??= sample.time;
        else paintSilence(sample.time);
      }

      // sustained and wandering notes as pills
      for (const box of collectBoxes()) {
        const x1 = xFor(now, box.start);
        const x2 = xFor(now, box.end);
        const y = yFor(box.midi);
        context.fillStyle =
          box.kind === 'sustained' ? PILL_SUSTAINED_FILL : PILL_WANDER_FILL;
        context.strokeStyle =
          box.kind === 'sustained' ? PILL_SUSTAINED_STROKE : PILL_WANDER_STROKE;
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(x1, y - 6, Math.max(4, x2 - x1 + 4), 12, 6);
        context.fill();
        context.stroke();
      }

      // ribbon: one polygon per voiced run, so a pause is a real gap instead of
      // a line joining the last note before it to the first note after it
      const fill = context.createLinearGradient(0, 0, width, 0);
      fill.addColorStop(0, withAlpha(BRASS, 0));
      fill.addColorStop(0.65, withAlpha(BRASS, 0.08));
      fill.addColorStop(1, withAlpha(BRASS, 0.22));
      context.fillStyle = fill;

      for (const run of voicedRuns(history)) {
        if (run.length < 2) continue;
        context.beginPath();
        context.moveTo(xFor(now, run[0].time), baseline);
        for (const sample of run) {
          context.lineTo(xFor(now, sample.time), yFor(sample.midi as number));
        }
        context.lineTo(xFor(now, run[run.length - 1].time), baseline);
        context.closePath();
        context.fill();
      }

      // trail: slate line for soft frames, brass over strong ones
      const soft = context.createLinearGradient(0, 0, width, 0);
      soft.addColorStop(0, withAlpha(SLATE, 0.05));
      soft.addColorStop(0.7, withAlpha(SLATE, 0.45));
      soft.addColorStop(1, withAlpha(SLATE, 0.9));
      strokeRuns(now, () => true, soft, 2);

      const strong = context.createLinearGradient(0, 0, width, 0);
      strong.addColorStop(0, withAlpha(BRASS, 0));
      strong.addColorStop(0.6, withAlpha(BRASS, 0.35));
      strong.addColorStop(1, withAlpha(BRASS, 1));
      strokeRuns(now, (sample) => sample.strong, strong, 2.4);

      // playhead: a hairline in the rail's muted ink, and a dot only while the
      // voice is actually sounding — a dot left sitting in a pause reads as a
      // note the reciter never made
      const newest = history[history.length - 1];
      const sounding =
        audio != null &&
        !audio.paused &&
        newest?.midi != null &&
        now - newest.time < 0.5;

      context.strokeStyle = withAlpha(SLATE, 0.7);
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(width - 1, 6);
      context.lineTo(width - 1, height - 6);
      context.stroke();

      if (sounding && newest?.midi != null) {
        const y = yFor(newest.midi);
        const glow = context.createRadialGradient(
          width - 1,
          y,
          0,
          width - 1,
          y,
          18
        );
        glow.addColorStop(0, withAlpha(BRASS, 0.45));
        glow.addColorStop(1, withAlpha(BRASS, 0));
        context.fillStyle = glow;
        context.beginPath();
        context.arc(width - 1, y, 18, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = withAlpha(BRASS, 1);
        context.beginPath();
        context.arc(width - 1, y, 3 + 3 * newest.level, 0, Math.PI * 2);
        context.fill();
      }
    };

    const tick = () => {
      frame = requestAnimationFrame(tick);

      if (audio && analyser && detector && buffer && !audio.paused) {
        const now = audio.currentTime;
        if (now !== lastTime) {
          lastTime = now;
          analyser.getFloatTimeDomainData(buffer);
          const level = rms(buffer);
          const [hz, clarity] = detector.findPitch(buffer, sampleRate);

          if (clarity >= minClarity && level >= silenceRms && hz > 0) {
            const corrected = correctOctave(lastMidi, midiFromHz(hz), clarity);
            const smoothed = smoother.smooth(corrected, now);
            lastMidi = smoothed;
            recent.push(smoothed);
            if (recent.length > SMOOTHING_SAMPLES) recent.shift();
            history.push({
              time: now,
              midi: smoothed,
              strong: clarity >= STRONG_CLARITY,
              level: Math.min(1, level / LOUD_RMS),
            });
          } else {
            recent.length = 0;
            history.push({ time: now, midi: null, strong: false, level: 0 });
          }

          const current = median(recent);
          statsRef.current?.({
            hz: current == null ? null : hzFromMidi(current),
            db: decibelsFromRms(level),
          });
        }
      }

      const now = audio?.currentTime ?? 0;
      while (
        history.length > 0 &&
        (now - history[0].time > windowSec || history[0].time > now + 0.5)
      ) {
        history.shift();
      }
      draw(now);
    };

    const resume = () => {
      void (analyser?.context as AudioContext | undefined)?.resume?.();
    };
    audio?.addEventListener('play', resume);
    audio?.addEventListener('playing', resume);

    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      audio?.removeEventListener('play', resume);
      audio?.removeEventListener('playing', resume);
    };
  }, [
    audio,
    height,
    windowSec,
    minMidi,
    maxMidi,
    minClarity,
    silenceRms,
    marks,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(styles.contour, className)}
      style={{ height }}
      aria-hidden="true"
    />
  );
}
