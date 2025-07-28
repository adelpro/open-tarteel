'use client';

import { useAtomValue } from 'jotai';
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
  const isFullscreen = useAtomValue(fullscreenAtom);
  useEffect(() => {
    if (selectedReciter) {
      const key = `${selectedReciter.id}-${selectedReciter.moshaf.id}`;
      syncView(key);
    }
  }, [selectedReciter]);

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
