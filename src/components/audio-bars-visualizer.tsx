'use client';

import { useAtomValue } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';

import { showVisualizerAtom } from '@/jotai/atom';
import { ensureAnalyser, getAnalyser } from '@/utils/audio-analyser';
import {
  follow,
  logBands,
  type VisualiserModel,
  waveTints,
} from '@/utils/visualiser-models';

const HEIGHT = 72;
const BARS = 28;
const GAP = 3;
const RIBBON_POINTS = 56;

const WAVES = [
  { gain: 1, attack: 0.5, release: 0.14 },
  { gain: 0.8, attack: 0.37, release: 0.12 },
  { gain: 0.62, attack: 0.27, release: 0.1 },
  { gain: 0.46, attack: 0.19, release: 0.08 },
];

const WAVE_ALPHA = [0.72, 0.55, 0.42, 0.3];

type Props = {
  audioId: string;
  isPlaying: boolean;
  /** False for cross-origin audio without CORS (e.g. Itqan). */
  enabled?: boolean;
  model?: VisualiserModel;
};

/**
 * Canvas spectrum with three shapes: bars, peaks, and a four-layer ribbon.
 *
 * All three read log-spaced bands in the 90–4500 Hz voice range, so every
 * column carries a real band; the old linear buckets left the far end of the
 * row flat on low-bitrate recitations. x index 0 sits at the right edge, which
 * keeps the bass where the eye starts in both LTR and RTL.
 */
export default function AudioBarsVisualizer({
  audioId,
  isPlaying,
  enabled = true,
  model = 'ribbon',
}: Props) {
  const showVisualizer = useAtomValue(showVisualizerAtom);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [everPlayed, setEverPlayed] = useState(false);

  useEffect(() => {
    if (isPlaying) setEverPlayed(true);
  }, [isPlaying]);

  // The context must be created after a play gesture, and only once per
  // element. CORS-less sources are never connected: they would be silent.
  useEffect(() => {
    if (!everPlayed || !enabled) return;
    const audio = document.getElementById(audioId) as HTMLAudioElement | null;
    if (!audio) return;
    const prime = () => {
      ensureAnalyser(audio);
    };
    prime();
    audio.addEventListener('play', prime);
    return () => audio.removeEventListener('play', prime);
  }, [audioId, enabled, everPlayed]);

  useEffect(() => {
    if (!everPlayed || !enabled || !showVisualizer) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas?.getContext('2d');
    if (!canvas || !canvasContext) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let width = 0;
    let barWidth = 2;
    let raf = 0;

    const levels = new Array<number>(BARS).fill(0);
    const peaks = new Array<number>(BARS).fill(0);
    const waves = WAVES.map(() => new Float32Array(RIBBON_POINTS));

    const readTokens = () => {
      const styles = getComputedStyle(document.documentElement);
      const pick = (name: string, fallback: string) =>
        styles.getPropertyValue(name).trim() || fallback;
      return {
        front: pick('--accent', '#0c6b53'),
        back: pick('--accent-line', '#bcd8ca'),
        line: pick('--border', '#e3dccb'),
      };
    };

    let tokens = readTokens();
    let tints = waveTints(tokens.front, tokens.back);

    const measure = () => {
      width = canvas.clientWidth || 320;
      barWidth = Math.max(2, (width - GAP * (BARS - 1)) / BARS);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
      canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /** Index 0 at the right edge, so the voice starts where the eye starts. */
    const xFor = (index: number, step = barWidth + GAP) =>
      width - barWidth - index * step;

    const barHeightFor = (level: number) => Math.pow(level, 0.65) * HEIGHT;

    const drawBars = () => {
      canvasContext.fillStyle = tints[0];
      for (let index = 0; index < levels.length; index += 1) {
        const barHeight = barHeightFor(levels[index]);
        if (barHeight < 0.5) continue;
        canvasContext.fillRect(
          xFor(index),
          HEIGHT - barHeight,
          barWidth,
          barHeight
        );
      }
    };

    const drawPeaks = () => {
      drawBars();
      for (let index = 0; index < peaks.length; index += 1) {
        if (peaks[index] <= 0) continue;
        const y = HEIGHT - barHeightFor(peaks[index]);
        canvasContext.fillRect(xFor(index), y - 2, barWidth, 1.5);
      }
    };

    const drawWaves = () => {
      const amplitude = (HEIGHT - 6) * 0.72;
      const step = width / (RIBBON_POINTS - 1);
      const y = new Float32Array(RIBBON_POINTS);
      const yFor = (level: number) =>
        HEIGHT - Math.pow(Math.min(1, level), 0.7) * amplitude;

      for (let layer = WAVES.length - 1; layer >= 0; layer -= 1) {
        const samples = waves[layer];
        for (let index = 0; index < samples.length; index += 1) {
          y[index] = yFor(samples[index]);
        }
        canvasContext.fillStyle = tints[layer];
        canvasContext.globalAlpha = WAVE_ALPHA[layer];
        canvasContext.beginPath();
        canvasContext.moveTo(width, y[0]);
        for (let index = 1; index < samples.length - 1; index += 1) {
          const x = width - index * step;
          canvasContext.quadraticCurveTo(
            x,
            y[index],
            x - step / 2,
            (y[index] + y[index + 1]) / 2
          );
        }
        canvasContext.lineTo(0, y[RIBBON_POINTS - 1]);
        canvasContext.lineTo(0, HEIGHT);
        canvasContext.lineTo(width, HEIGHT);
        canvasContext.closePath();
        canvasContext.fill();
      }

      canvasContext.globalAlpha = 1;
      canvasContext.fillStyle = tokens.line;
      canvasContext.fillRect(0, HEIGHT - 1, width, 1);
    };

    const draw = () => {
      canvasContext.clearRect(0, 0, width, HEIGHT);
      canvasContext.globalAlpha = 1;
      if (!isPlaying) return;
      if (model === 'peaks') drawPeaks();
      else if (model === 'bars') drawBars();
      else drawWaves();
      canvasContext.globalAlpha = 1;
    };

    measure();
    draw();

    const observer = new ResizeObserver(() => {
      measure();
      draw();
    });
    observer.observe(canvas);

    const theme = new MutationObserver(() => {
      tokens = readTokens();
      tints = waveTints(tokens.front, tokens.back);
      draw();
    });
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    if (!isPlaying || reduced) {
      return () => {
        observer.disconnect();
        theme.disconnect();
      };
    }

    const bins = new Uint8Array(512);

    const tick = () => {
      const analyser = getAnalyser();
      if (analyser) {
        analyser.getByteFrequencyData(bins);
        if (model === 'ribbon') {
          const target = logBands(
            bins,
            RIBBON_POINTS,
            analyser.context.sampleRate
          );
          for (const [layer, style] of WAVES.entries()) {
            const samples = waves[layer];
            for (let index = 0; index < samples.length; index += 1) {
              samples[index] = follow(
                samples[index],
                target[index] * style.gain,
                style.attack,
                style.release
              );
            }
          }
        } else {
          const target = logBands(bins, BARS, analyser.context.sampleRate);
          for (let index = 0; index < BARS; index += 1) {
            levels[index] = follow(levels[index], target[index], 0.5, 0.14);
            peaks[index] = Math.max(levels[index], peaks[index] - 0.008);
          }
        }
        draw();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      theme.disconnect();
    };
  }, [everPlayed, enabled, isPlaying, model, showVisualizer]);

  return (
    <div
      className="mb-2 flex w-full max-w-md justify-center"
      style={{ height: HEIGHT }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full transition-opacity duration-200"
        style={{ opacity: enabled && isPlaying && showVisualizer ? 1 : 0 }}
      />
    </div>
  );
}
