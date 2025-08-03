import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

import { showVisualizerAtom } from '@/jotai/atom';

type AudioVisualizerProps = {
  audioId: string;
  isPlaying: boolean;
};

const WAVE_SETTINGS = [
  {
    color: '06B6D4', // Cyan-500 (modified wave)
    frequencyBand: { start: 0, end: 32 },
    baseFrequency: 0.01,
    lineWidth: 2.5,
  },
  {
    color: '8B5CF6', // Violet-500
    frequencyBand: { start: 33, end: 80 },
    baseFrequency: 0.018,
    lineWidth: 2,
  },
  {
    color: 'F97316', // Orange-500
    frequencyBand: { start: 81, end: 255 },
    baseFrequency: 0.026,
    lineWidth: 1.8,
  },
];

const AMPLITUDE_EASING = 0.1;
const BASE_PHASE_INCREMENT = 0.04; // faster
const ENERGY_DRIVEN_SPEED = 0.25; // faster
const ECHO_LAYERS = 4;
const ECHO_FADE = 0.65;

const hexToRgba = (hex: string, alpha: number) => {
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type FrameSnapshot = {
  amplitudes: number[];
  phase: number;
};

export default function AudioWaveVisualizer({
  audioId,
  isPlaying,
}: AudioVisualizerProps) {
  const showVisualizer = useAtomValue(showVisualizerAtom);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const frameRef = useRef<FrameSnapshot[]>([]);

  useEffect(() => {
    if (!showVisualizer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const audio = document.querySelector<HTMLAudioElement>(`#${audioId}`);

    if (!audio || !context) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    if (!audioContextRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const context_ = new AC();
      audioContextRef.current = context_;
      analyserRef.current = context_.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceRef.current = context_.createMediaElementSource(audio);
      sourceRef.current
        .connect(analyserRef.current)
        .connect(context_.destination);
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    if (frameRef.current.length === 0) {
      frameRef.current.push({
        amplitudes: Array.from({ length: WAVE_SETTINGS.length }, () => 0),
        phase: 0,
      });
    }

    const draw = () => {
      if (!isPlaying) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        return;
      }

      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(frequencyData);

      const { width, height } = canvas;
      const centerY = height / 2;

      context.clearRect(0, 0, width, height);

      const totalEnergy =
        frequencyData.reduce((accumulator, v) => accumulator + v, 0) /
        frequencyData.length;
      const phaseSpeed =
        BASE_PHASE_INCREMENT + (totalEnergy / 255) * ENERGY_DRIVEN_SPEED;

      const previous = frameRef.current[0];
      const phase = previous.phase + phaseSpeed;

      const amplitudes = WAVE_SETTINGS.map(({ frequencyBand }, index) => {
        const { start, end } = frequencyBand;
        const slice = frequencyData.slice(start, end);
        const avg = slice.reduce((sum, v) => sum + v, 0) / slice.length || 0;
        const target = (avg / 255) * (height * 0.3);
        return (
          previous.amplitudes[index] +
          (target - previous.amplitudes[index]) * AMPLITUDE_EASING
        );
      });

      frameRef.current.unshift({ amplitudes, phase });
      if (frameRef.current.length > ECHO_LAYERS + 1) frameRef.current.pop();

      for (let index = frameRef.current.length - 1; index > 0; index--) {
        const frame = frameRef.current[index];
        const fade = ECHO_FADE ** index;

        for (const [waveIndex, config] of WAVE_SETTINGS.entries()) {
          const { baseFrequency, color, lineWidth } = config;

          context.strokeStyle = hexToRgba(color, fade * 0.4);
          context.lineWidth = lineWidth * fade;

          context.beginPath();
          context.moveTo(0, centerY);

          for (let x = 0; x < width; x++) {
            let y: number;
            if (waveIndex === 0) {
              const moduleFreq =
                baseFrequency * (1 + 0.3 * Math.sin(frame.phase));
              y =
                centerY +
                frame.amplitudes[waveIndex] *
                  (Math.sin(x * moduleFreq + frame.phase) +
                    0.5 * Math.cos(x * moduleFreq * 1.5 + frame.phase));
            } else {
              y =
                centerY +
                frame.amplitudes[waveIndex] *
                  Math.sin(x * baseFrequency + frame.phase);
            }
            context.lineTo(x, y);
          }
          context.stroke();
        }
      }

      // Draw current frame (strongest wave)
      const current = frameRef.current[0];
      for (const [waveIndex, config] of WAVE_SETTINGS.entries()) {
        const { baseFrequency, color, lineWidth } = config;

        context.strokeStyle = hexToRgba(color, 1);
        context.lineWidth = lineWidth;

        context.beginPath();
        context.moveTo(0, centerY);
        for (let x = 0; x < width; x++) {
          let y: number;
          if (waveIndex === 0) {
            const moduleFreq =
              baseFrequency * (1 + 0.3 * Math.sin(current.phase));
            y =
              centerY +
              current.amplitudes[waveIndex] *
                (Math.sin(x * moduleFreq + current.phase) +
                  0.5 * Math.cos(x * moduleFreq * 1.5 + current.phase));
          } else {
            y =
              centerY +
              current.amplitudes[waveIndex] *
                Math.sin(x * baseFrequency + current.phase);
          }
          context.lineTo(x, y);
        }
        context.stroke();
      }
    };

    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      draw();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [showVisualizer, isPlaying, audioId]);

  useEffect(() => {
    return () => {
      sourceRef.current?.disconnect();
      audioContextRef.current?.close().catch(console.error);
      audioContextRef.current = null;
    };
  }, []);

  if (!showVisualizer) return null;

  return (
    <div className="mb-4 flex h-[250px] w-full justify-center">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
