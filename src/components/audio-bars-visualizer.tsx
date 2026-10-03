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

type AudioVisualizerProps = {
  audioId: string;
  isPlaying: boolean;
};

export default function AudioBarsVisualizer({
  audioId,
  isPlaying,
}: AudioVisualizerProps) {
  const showVisualizer = useAtomValue(showVisualizerAtom);
  const [visualizerWidth, setVisualizerWidth] = useState(400);

  // Track whether the user has ever started playback.
  // We only mount ReactAudioSpectrum AFTER the first play so the AudioContext
  // is created in response to user interaction (running state, not suspended).
  // Once mounted we never unmount it — the Web Audio API only allows one
  // MediaElementSourceNode per HTMLMediaElement.
  const everPlayedRef = useRef(false);
  const [everPlayed, setEverPlayed] = useState(false);

  useEffect(() => {
    if (isPlaying && !everPlayedRef.current) {
      everPlayedRef.current = true;
      setEverPlayed(true);
    }
  }, [isPlaying]);

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

  const visible = showVisualizer && isPlaying;

  // Before first play: render placeholder (no AudioContext created yet)
  if (!everPlayed) {
    return (
      <div
        className="mb-2 flex h-[90px] w-full max-w-md justify-center"
        style={{ visibility: 'hidden' }}
      />
    );
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
        meterWidth={10}
        meterColor="#0191e2"
        gap={4}
        silent={!isPlaying}
      />
    </div>
  );
}
