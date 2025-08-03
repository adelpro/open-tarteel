// components/audio-visualizer.tsx
'use client'; // This component requires client-side rendering due to window access and ReactAudioSpectrum

import { useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import ReactAudioSpectrum from 'react-audio-spectrum';

import { showVisualizerAtom } from '@/jotai/atom';

type AudioVisualizerProps = {
  audioId: string; // The ID of the audio element to visualize (e.g., "audio")
  isPlaying: boolean; // Prop to indicate if audio is currently playing
};

export default function AudioBarsVisualizer({
  audioId,
  isPlaying,
}: AudioVisualizerProps) {
  const showVisualizer = useAtomValue(showVisualizerAtom);
  const [visualizerWidth, setVisualizerWidth] = useState(400); // Initial fallback width

  useEffect(() => {
    // This code only runs on the client-side after the component mounts
    const calculateWidth = () => {
      // Calculate width based on window size, capping at 400px (or your desired max)
      setVisualizerWidth(Math.min(window.innerWidth * 0.8, 400));
    };

    // Set initial width
    calculateWidth();

    // Add event listener for window resize to update width dynamically
    window.addEventListener('resize', calculateWidth);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', calculateWidth);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Only render the visualizer if showVisualizer is true AND audio is playing.
  // The visualizer button's disabled state already handles `isPlaying`,
  // but this ensures the component itself doesn't render the spectrum if not active.
  if (!showVisualizer || !isPlaying) {
    return null; // Or return <div className="mb-4 w-full h-[100px]" /> if you need to maintain space
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
