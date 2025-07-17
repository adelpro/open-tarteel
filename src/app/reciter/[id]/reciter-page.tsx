'use client';

import { useAtomValue } from 'jotai';
import { DevTools } from 'jotai-devtools';
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';

import PwaUpdater from '@/components/pwa-updater';
import ReciterSelector from '@/components/reciter-selector';
import SimpleSkeleton from '@/components/simple-skeleton';
import { syncView } from '@/gun/view-rank';
import { selectedReciterAtom } from '@/jotai/atom';

export default function ReciterPage() {
  const Player = dynamic(() => import('@/components/player'), { ssr: false });
  const selectedReciter = useAtomValue(selectedReciterAtom);

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
        <ReciterSelector />

        {selectedReciter && selectedReciter.moshaf && (
          <Suspense fallback={<SimpleSkeleton />}>
            <Player playlist={selectedReciter.moshaf.playlist} />
          </Suspense>
        )}
        <PwaUpdater />
      </div>
    </div>
  );
}
