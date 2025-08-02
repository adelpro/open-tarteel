'use client';

import { useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import ReactAudioSpectrum from 'react-audio-spectrum';

import { showVisualizerAtom } from '@/jotai/atom';

type AudioVisualizerProps = {
  audioId: string;
  isPlaying: boolean;
};

export default function AudioVisualizer({
  audioId,
  isPlaying,
}: AudioVisualizerProps) {
  const showVisualizer = useAtomValue(showVisualizerAtom);
  const [visualizerWidth, setVisualizerWidth] = useState(400);

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

  if (!showVisualizer || !isPlaying) {
    return null;
  }

  return (
    <div className="mb-4 flex w-full justify-center">
      <ReactAudioSpectrum
        id="audio-spectrum"
        audioId={audioId}
        height={100}
        width={visualizerWidth}
        capColor="#0191e2"
        meterWidth={10}
        meterColor="#0191e2"
        gap={4}
      />
    </div>
  );
}
