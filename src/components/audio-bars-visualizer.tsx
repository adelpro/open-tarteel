'use client';

import { useAtomValue } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import ReactAudioSpectrum from 'react-audio-spectrum';

if (typeof window !== 'undefined') {
  const OriginalAudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  if (
    OriginalAudioContext &&
    !(OriginalAudioContext.prototype as any).__patched
  ) {
    const originalCreate =
      OriginalAudioContext.prototype.createMediaElementSource;
    OriginalAudioContext.prototype.createMediaElementSource = function (
      mediaElement: HTMLMediaElement
    ) {
      if ((mediaElement as any).__mediaElementSource) {
        return (mediaElement as any).__mediaElementSource;
      }
      const source = originalCreate.call(this, mediaElement);
      (mediaElement as any).__mediaElementSource = source;
      return source;
    };
    (OriginalAudioContext.prototype as any).__patched = true;
  }
}

import { showVisualizerAtom } from '@/jotai/atom';

const FALLBACK_LEVELS = [
  0.35, 0.55, 0.42, 0.7, 0.48, 0.82, 0.58, 0.38, 0.64, 0.9, 0.52, 0.76, 0.44,
  0.68, 0.36, 0.8, 0.56, 0.72, 0.46, 0.88, 0.6, 0.4, 0.74, 0.5, 0.66, 0.34,
  0.78, 0.54,
];

function SpectrumFallback({
  active,
  visible,
}: {
  active: boolean;
  visible: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="mb-2 flex h-[90px] w-full max-w-md items-end justify-center gap-[3px] px-4"
      style={{ visibility: visible ? 'visible' : 'hidden' }}
    >
      {FALLBACK_LEVELS.map((level, index) => (
        <span
          key={index}
          className="spectrum-bar w-1.5 rounded-full bg-blue-500/80 dark:bg-blue-400/70"
          style={{
            height: `${Math.round(level * 100)}%`,
            transformOrigin: 'bottom',
            animation: active
              ? `spectrum-bar 1.1s ease-in-out ${index * 0.035}s infinite`
              : undefined,
            opacity: active ? 1 : 0.55,
          }}
        />
      ))}
    </div>
  );
}

type AudioVisualizerProps = {
  audioId: string;
  isPlaying: boolean;
  /** False for cross-origin audio without CORS (e.g. Itqan). */
  enabled?: boolean;
};

export default function AudioBarsVisualizer({
  audioId,
  isPlaying,
  enabled = true,
}: AudioVisualizerProps) {
  const showVisualizer = useAtomValue(showVisualizerAtom);
  const [visualizerWidth, setVisualizerWidth] = useState(400);

  // Track whether the user has ever started playback.
  // Mount ReactAudioSpectrum on the first play render (not the next one) so the
  // AudioContext is created in response to user interaction and the library can
  // start animating immediately. Once mounted we never unmount it — the Web
  // Audio API only allows one MediaElementSourceNode per HTMLMediaElement.
  const [everPlayed, setEverPlayed] = useState(false);

  useEffect(() => {
    if (isPlaying && !everPlayed) {
      setEverPlayed(true);
    }
  }, [isPlaying, everPlayed]);

  useEffect(() => {
    const calculateWidth = () => {
      setVisualizerWidth(Math.min(window.innerWidth * 0.8, 400));
    };

    calculateWidth();
    window.addEventListener('resize', calculateWidth);
    return () => {
      window.removeEventListener('resize', calculateWidth);
    };
  }, []);

  const visible = showVisualizer && isPlaying && enabled;
  const mountSpectrum = everPlayed || isPlaying;

  // Keep the height but never create an AudioContext for a source the browser
  // refuses to share samples from.
  // Itqan has no CORS, so use a CSS-only spectrum instead of silence.
  if (!enabled) {
    return <SpectrumFallback active={isPlaying} visible={showVisualizer} />;
  }

  // Before first play: show a static baseline (no AudioContext created yet).
  if (!mountSpectrum) {
    return <SpectrumFallback active={false} visible={showVisualizer} />;
  }

  // After first play: keep ReactAudioSpectrum permanently mounted,
  // only toggle CSS visibility so the MediaElementSourceNode is never recreated.
  return (
    <div
      className="mb-2 flex h-[90px] w-full max-w-md justify-center"
      style={{ visibility: visible ? 'visible' : 'hidden' }}
    >
      <ReactAudioSpectrum
        id="audio-spectrum"
        audioId={audioId}
        height={90}
        width={visualizerWidth}
        capColor="#0191e2"
        capHeight={2}
        meterWidth={10}
        meterCount={28}
        meterColor="#0191e2"
        gap={4}
        silent={!isPlaying}
      />
    </div>
  );
}
