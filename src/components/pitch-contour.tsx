'use client';

import { PitchDetector } from 'pitchy';
import { useEffect, useRef } from 'react';

import {
  clampMidi,
  decibelsFromRms,
  hzFromMidi,
  median,
  midiFromHz,
  noteName,
  rms,
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

const SMOOTHING_SAMPLES = 5;
const GRID_SEMITONES = 3;
const STABLE_SEMITONES = 0.6;
const STABLE_SECONDS = 0.22;
const SILENCE_SECONDS = 0.3;
const STRONG_CLARITY = 0.93;

const GRID_COLOR = 'rgba(148, 163, 184, 0.35)';
const MARK_COLOR = 'rgba(210, 220, 250, 0.28)';
const WANDER_COLOR = '#c9a91c';
const SUSTAINED_COLOR = '#4a63e6';
const LINE_SOFT = '#dfe4f2';
const LINE_STRONG = '#f5c518';
const SILENCE_FILL = 'rgba(148, 158, 180, 0.10)';
const SILENCE_STROKE = 'rgba(148, 158, 180, 0.45)';

type Sample = { time: number; midi: number | null; strong: boolean };

type Box = { start: number; end: number; midi: number; kind: 'sustained' | 'wander' };

/**
 * Rolling pitch contour from the shared AudioContext. Mirrors the original
 * pitch-contour view: gold for strong frames, boxes over sustained notes, gray
 * bands over pauses, faint marks at ayah starts, and a gold playhead.
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
      const usable = Math.max(1, canvas.clientWidth - 34);
      const pxPerSecond = usable / windowSec;
      return canvas.clientWidth - 1 - Math.max(0, now - time) * pxPerSecond;
    };

    const collectBoxes = (): Box[] => {
      const boxes: Box[] = [];
      let run: Sample[] = [];
      const flush = () => {
        if (run.length < 2) {
          run = [];
          return;
        }
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
        run = [];
      };

      for (const sample of history) {
        if (sample.midi == null) {
          flush();
        } else {
          run.push(sample);
        }
      }
      flush();
      return boxes;
    };

    const draw = (now: number) => {
      const width = canvas.clientWidth;
      context.clearRect(0, 0, width, height);

      // grid + note labels
      context.strokeStyle = GRID_COLOR;
      context.fillStyle = GRID_COLOR;
      context.lineWidth = 1;
      context.font = '10px system-ui, sans-serif';
      for (let midi = minMidi; midi <= maxMidi; midi += GRID_SEMITONES) {
        const y = yFor(midi);
        context.beginPath();
        context.moveTo(34, y);
        context.lineTo(width, y);
        context.stroke();
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

      // pause bands: quiet stretches between voiced runs
      let silenceStart: number | null = null;
      const drawSilence = (end: number) => {
        if (silenceStart == null) return;
        if (end - silenceStart >= SILENCE_SECONDS) {
          const x1 = xFor(now, silenceStart);
          const x2 = xFor(now, end);
          context.fillStyle = SILENCE_FILL;
          context.strokeStyle = SILENCE_STROKE;
          context.fillRect(x1, 6, x2 - x1, height - 12);
          context.strokeRect(x1, 6, x2 - x1, height - 12);
        }
        silenceStart = null;
      };
      for (const sample of history) {
        if (sample.midi == null) {
          silenceStart ??= sample.time;
        } else {
          drawSilence(sample.time);
        }
      }

      // sustained and wandering note boxes
      for (const box of collectBoxes()) {
        const x1 = xFor(now, box.start);
        const x2 = xFor(now, box.end);
        const y = yFor(box.midi);
        context.fillStyle =
          box.kind === 'sustained' ? 'rgba(79,107,255,0.12)' : 'rgba(245,197,24,0.10)';
        context.strokeStyle =
          box.kind === 'sustained' ? SUSTAINED_COLOR : WANDER_COLOR;
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(x1, y - 7, Math.max(3, x2 - x1 + 4), 14, 4);
        context.fill();
        context.stroke();
      }

      // the contour itself, gold where the frame was strong
      context.lineWidth = 2;
      let started = false;
      let color = '';
      for (const sample of history) {
        if (sample.midi == null) {
          started = false;
          continue;
        }
        const next = sample.strong ? LINE_STRONG : LINE_SOFT;
        if (next !== color) {
          context.strokeStyle = next;
          color = next;
        }
        const x = xFor(now, sample.time);
        const y = yFor(sample.midi);
        if (!started) {
          context.beginPath();
          context.moveTo(x, y);
          started = true;
        } else {
          context.lineTo(x, y);
        }
        context.stroke();
        context.beginPath();
        context.moveTo(x, y);
      }

      // playhead: vertical bar and gold dot
      const last = [...history].reverse().find((sample) => sample.midi != null);
      context.strokeStyle = 'rgba(245,197,24,0.55)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(width - 1, 6);
      context.lineTo(width - 1, height - 6);
      context.stroke();

      if (last?.midi != null) {
        const y = yFor(last.midi);
        context.fillStyle = LINE_STRONG;
        context.beginPath();
        context.arc(width - 1, y, 4.5, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = 'rgba(245,197,24,0.5)';
        context.beginPath();
        context.arc(width - 1, y, 9, 0, Math.PI * 2);
        context.stroke();
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
            recent.push(midiFromHz(hz));
            if (recent.length > SMOOTHING_SAMPLES) recent.shift();
            history.push({
              time: now,
              midi: median(recent),
              strong: clarity >= STRONG_CLARITY,
            });
          } else {
            recent.length = 0;
            history.push({ time: now, midi: null, strong: false });
          }

          const smoothed = median(recent);
          statsRef.current?.({
            hz: smoothed == null ? null : hzFromMidi(smoothed),
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
