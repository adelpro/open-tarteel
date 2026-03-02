'use client';

import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';

import { usePlayer } from '@/hooks/player/use-player';
import { showVisualizerAtom } from '@/jotai';
import { cn } from '@/utils';

const AudioSpectrum = dynamic(() => import('./audio-spectrum'), {
  ssr: false,
});
// ─────────── Component ───────────
export default function AudioBarsVisualizer() {
  const { isPlaying } = usePlayer();
  const showVisualizer = useAtomValue(showVisualizerAtom);

  // here return empty div easiest solution to maintain layout;
  if (!showVisualizer) return <div />;

  return (
    <div
      className={cn(
        'w-full max-w-md overflow-hidden',
        'hidden md:flex',
        'h-[var(--audio-spectrum-hight)]'
      )}
    >
      <AudioSpectrum silent={!isPlaying} showSpectrum={showVisualizer} />
    </div>
  );
}
