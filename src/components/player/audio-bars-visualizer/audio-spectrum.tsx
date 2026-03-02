'use client';

import { useEffect, useRef } from 'react';

import { globalAudioRef } from '@/lib/audio-ref';

function getCssVariableColor(variableName: string, fallback = '#000000') {
  const color = getComputedStyle(document.documentElement) //
    .getPropertyValue(variableName);

  return color || fallback;
}
function getCssNumber(variableName: string, fallback: number) {
  if (globalThis.window === undefined) return fallback;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
// ─────────── Config ───────────
const CONFIG = {
  // ────────── Visuals ──────────
  BAR_COUNT: 50, // Number of vertical bars in the visualizer
  BAR_COLOR: getCssVariableColor('--audio-bar-color'), // Color of the main bars when playing
  CAP_COLOR: getCssVariableColor('--audio-cap-color'), // Color of the "caps" (the small peak indicators above bars)
  CAP_HEIGHT: 2, // Height in pixels of the caps
  GAP: 4, // Horizontal spacing in pixels between bars
  CANVAS_WIDTH: getCssNumber('--audio-spectrum-width', 400), // Width of the canvas element
  // FIXME:
  // Currently subtracting 10px because the CSS variable `--audio-spectrum-hight`
  // does not exactly match the rendered layout height due to parent spacing /
  // line-height / potential padding differences.
  // This is a temporary visual adjustment until fully normalize
  // container sizing and remove layout offset inconsistencies.
  CANVAS_HEIGHT: getCssNumber('--audio-spectrum-hight', 80), // Height of the canvas element

  // ────────── Physics / Animation ──────────
  FALLBACK_HEIGHT: 4, // Minimum bar height when silent or at rest
  BAR_DECAY_RATE: 1.5, // How fast the bar falls when audio level decreases (pixels per frame)
  CAP_DECAY_RATE: 0.8, // How fast the cap falls after the bar peak (pixels per frame)
  BAR_RISE_RATE: 0.05, // How fast bars rise toward new peaks (0 = instant, 1 = extremely slow)
  CAP_RISE_RATE: 1, // How fast caps rise to follow the bar (0 = instant, 1 = extremely slow)

  // ────────── Audio Analysis ──────────
  SMOOTHING_TIME: 0.8, // Audio analyser smoothing constant (0 = no smoothing, 1 = max smoothing)
  FFT_SIZE: 2048, // Number of frequency bins in the FFT (higher = more detailed spectrum)
  FREQUENCY_RANGE_LIMIT: 0.35, // Fraction of the frequency spectrum used for bars (e.g., lower 35% of spectrum)
};

// ─────────── Audio Graph Helper ───────────
let audioContext: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;

function getAudioGraph(audio: HTMLAudioElement): AnalyserNode | null {
  if (audioContext && sourceNode && analyserNode) return analyserNode;
  try {
    const AudioContextClass =
      globalThis.window.AudioContext ||
      (globalThis.window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
    sourceNode = audioContext.createMediaElementSource(audio);
    analyserNode = audioContext.createAnalyser();
    analyserNode.smoothingTimeConstant = CONFIG.SMOOTHING_TIME;
    analyserNode.fftSize = CONFIG.FFT_SIZE;
    sourceNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
    return analyserNode;
  } catch (err) {
    console.warn('[AudioBarsVisualizer] Web Audio setup failed:', err);
    return null;
  }
}

// ─────────── Physics Helpers ───────────
function lerp(current: number, target: number, speed: number) {
  return current + (target - current) * speed;
}

function updateBarHeight(
  current: number,
  target: number,
  decay: number,
  min = 0,
  riseSpeed = 0.2
) {
  if (target > current) {
    return lerp(current, target, riseSpeed);
  } else {
    return Math.max(min, current - decay);
  }
}

function sampleFrequency(array: Uint8Array, index: number, barCount: number) {
  const start = Math.floor(
    index * ((array.length * CONFIG.FREQUENCY_RANGE_LIMIT) / barCount)
  );
  const end = Math.floor(
    ((index + 1) * array.length * CONFIG.FREQUENCY_RANGE_LIMIT) / barCount
  );
  let sum = 0;
  for (let index_ = start; index_ < end; index_++) sum += array[index_];
  return sum / (end - start || 1);
}

// ─────────── Drawing Helper ───────────
function drawBars(
  context: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  barHeights: number[],
  caps: number[]
) {
  const W = CONFIG.CANVAS_WIDTH;
  const H = CONFIG.CANVAS_HEIGHT;
  const barWidth = (W - CONFIG.GAP * (CONFIG.BAR_COUNT - 1)) / CONFIG.BAR_COUNT;

  for (let index = 0; index < CONFIG.BAR_COUNT; index++) {
    const rawValue = sampleFrequency(dataArray, index, CONFIG.BAR_COUNT);
    const targetHeight = Math.max(CONFIG.FALLBACK_HEIGHT, (rawValue / 255) * H);

    barHeights[index] = updateBarHeight(
      barHeights[index],
      targetHeight,
      CONFIG.BAR_DECAY_RATE,
      CONFIG.FALLBACK_HEIGHT,
      CONFIG.BAR_RISE_RATE
    );
    caps[index] = updateBarHeight(
      caps[index],
      barHeights[index],
      CONFIG.CAP_DECAY_RATE,
      CONFIG.FALLBACK_HEIGHT,
      CONFIG.CAP_RISE_RATE
    );

    const x = index * (barWidth + CONFIG.GAP);
    const y = H - barHeights[index];

    // Draw Bar
    context.fillStyle = CONFIG.BAR_COLOR;
    context.fillRect(x, y, barWidth, barHeights[index]);

    // Draw Cap
    const capY = H - caps[index] - CONFIG.CAP_HEIGHT - 1;
    context.fillStyle = CONFIG.CAP_COLOR;
    context.fillRect(x, capY, barWidth, CONFIG.CAP_HEIGHT);
  }
}
type Props = {
  silent?: boolean;
  showSpectrum?: boolean;
};
// ─────────── Component ───────────
export default function AudioSpectrum({
  silent = false,
  showSpectrum = true,
}: Readonly<Props>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const barHeightsRef = useRef<number[]>(
    new Array(CONFIG.BAR_COUNT).fill(CONFIG.FALLBACK_HEIGHT)
  );
  const capsRef = useRef<number[]>(
    new Array(CONFIG.BAR_COUNT).fill(CONFIG.FALLBACK_HEIGHT)
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const audio = globalAudioRef.current;
    if (!canvas || !audio) return;

    const context = canvas.getContext('2d');
    const analyser = getAudioGraph(audio);

    if (!analyser || !context) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function animate() {
      if (!analyser || !context) return;

      rafRef.current = requestAnimationFrame(animate);
      context.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      if (audioContext?.state === 'suspended') audioContext.resume();

      if (silent) dataArray.fill(0);
      else analyser.getByteFrequencyData(dataArray);

      drawBars(context, dataArray, barHeightsRef.current, capsRef.current);
    }

    animate();

    return () => cancelAnimationFrame(rafRef.current);
  }, [silent, showSpectrum]);

  if (!showSpectrum) return <div />;
  return (
    <canvas
      ref={canvasRef}
      width={CONFIG.CANVAS_WIDTH}
      height={CONFIG.CANVAS_HEIGHT}
      className="block h-full w-full"
    />
  );
}
