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
  onStats?: (stats: { hz: number | null; db: number }) => void;
  className?: string;
}

const SMOOTHING_SAMPLES = 5;
const GRID_SEMITONES = 3;
const IDLE_COLOR = 'rgba(148, 163, 184, 0.35)';

type Sample = { time: number; midi: number | null };

/**
 * Rolling pitch contour drawn from the shared AudioContext. It never creates
 * its own context and never closes one: the player owns it, and the spectrum
 * visualiser is connected to it too.
 */
export function PitchContour({
  audio,
  height = 160,
  windowSec = 12,
  minMidi = 45,
  maxMidi = 62,
  minClarity = 0.8,
  silenceRms = 0.008,
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

    const drawGrid = (now: number) => {
      context.clearRect(0, 0, canvas.clientWidth, height);
      context.strokeStyle = IDLE_COLOR;
      context.fillStyle = IDLE_COLOR;
      context.lineWidth = 1;
      context.font = '10px system-ui, sans-serif';

      for (let midi = minMidi; midi <= maxMidi; midi += GRID_SEMITONES) {
        const y = yFor(midi);
        context.beginPath();
        context.moveTo(34, y);
        context.lineTo(canvas.clientWidth, y);
        context.stroke();
        context.fillText(noteName(midi), 2, y + 3);
      }

      const usable = Math.max(1, canvas.clientWidth - 34);
      const pxPerSecond = usable / windowSec;
      context.strokeStyle = 'rgba(248, 250, 252, 0.55)';
      context.beginPath();
      context.moveTo(canvas.clientWidth - 1, 8);
      context.lineTo(canvas.clientWidth - 1, height - 8);
      context.stroke();

      context.strokeStyle = 'rgba(248, 250, 252, 0.9)';
      context.lineWidth = 2;
      context.beginPath();
      let started = false;
      for (const sample of history) {
        if (sample.midi == null) {
          started = false;
          continue;
        }
        const x =
          canvas.clientWidth - 1 - Math.max(0, now - sample.time) * pxPerSecond;
        const y = yFor(sample.midi);
        if (!started) {
          context.moveTo(x, y);
          started = true;
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    };

    const resume = () => {
      void (analyser?.context as AudioContext | undefined)?.resume?.();
    };
    audio?.addEventListener('play', resume);
    audio?.addEventListener('playing', resume);

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
            history.push({ time: now, midi: median(recent) });
          } else {
            recent.length = 0;
            history.push({ time: now, midi: null });
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
      drawGrid(now);
    };

    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      audio?.removeEventListener('play', resume);
      audio?.removeEventListener('playing', resume);
    };
  }, [audio, height, windowSec, minMidi, maxMidi, minClarity, silenceRms]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(styles.contour, className)}
      style={{ height }}
      aria-hidden="true"
    />
  );
}
