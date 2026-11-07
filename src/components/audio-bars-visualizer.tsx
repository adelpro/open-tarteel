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

const VISUALIZER_HEIGHT = 90;

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
  const hasPrimedRef = useRef(false);

  useEffect(() => {
    if (isPlaying && !everPlayed) {
      setEverPlayed(true);
    }
  }, [isPlaying, everPlayed]);

  useEffect(() => {
    if (!enabled || !isPlaying || !everPlayed || hasPrimedRef.current) return;

    const audio = document.getElementById(audioId) as HTMLAudioElement | null;
    if (!audio || audio.paused) return;

    // react-audio-spectrum attaches its `onplay` handler inside its own effect.
    // On the very first play the real play event has already fired by the time
    // the component mounts, so re-dispatch it once to start the analyser.
    hasPrimedRef.current = true;
    const frame = requestAnimationFrame(() => {
      if (!audio.paused) audio.dispatchEvent(new Event('play'));
    });
    return () => cancelAnimationFrame(frame);
  }, [audioId, enabled, isPlaying, everPlayed]);

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

  // Providers without CORS (e.g. Itqan) have no real spectrum data. Do not
  // reserve an empty visualizer area for them.
  if (!enabled) return null;

  // Before the first play there is nothing real to draw; do not show a fake
  // placeholder.
  if (!mountSpectrum) return null;

  // After first play: keep ReactAudioSpectrum permanently mounted,
  // only toggle CSS visibility so the MediaElementSourceNode is never recreated.
  return (
    <div
      className="mb-2 flex w-full max-w-md justify-center"
      style={{
        height: VISUALIZER_HEIGHT,
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      <ReactAudioSpectrum
        id="audio-spectrum"
        audioId={audioId}
        height={VISUALIZER_HEIGHT}
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
