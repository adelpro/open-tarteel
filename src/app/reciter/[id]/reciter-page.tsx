'use client';

import { useAtom, useAtomValue } from 'jotai';
import { DevTools } from 'jotai-devtools';
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';

import PwaUpdater from '@/components/pwa-updater';
import ReciterSelector from '@/components/reciter-selector';
import SimpleSkeleton from '@/components/simple-skeleton';
import { syncView } from '@/gun/view-rank';
import { fullscreenAtom, selectedReciterAtom } from '@/jotai/atom';

// ✅ Move dynamic import outside the component
const Player = dynamic(() => import('@/components/player'), { ssr: false });

export default function ReciterPage() {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);

  useEffect(() => {
    console.log('test');
    function handleKeyDown(event: KeyboardEvent) {
      console.log(event.key);
      if (event.key === 'Escape' && isFullscreen) {
        setFullscreen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, setFullscreen]);

  return (
    <div className="flex w-full items-center justify-center p-4 md:p-6">
      <div className="flex w-full max-w-lg flex-col items-center justify-center gap-4">
        <DevTools />
        {isFullscreen ? <></> : <ReciterSelector />}
        {isFullscreen ? (
          <p className="mb-10 flex items-center justify-center gap-2 text-4xl font-bold text-gray-500">
            {selectedReciter?.name}
          </p>
        ) : (
          <></>
        )}
        {selectedReciter?.moshaf && (
          <Suspense fallback={<SimpleSkeleton />}>
            <Player playlist={selectedReciter.moshaf.playlist} />
          </Suspense>
        )}
        <PwaUpdater />
      </div>
    </div>
  );
}
