'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { DevTools } from 'jotai-devtools';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect } from 'react';

import PwaUpdater from '@/components/pwa-updater';
import ReciterSelector from '@/components/reciter-selector';
import SimpleSkeleton from '@/components/simple-skeleton';
import { useReciters } from '@/hooks/use-reciters';
import { fullscreenAtom, selectedReciterAtom } from '@/jotai/atom';

const Player = dynamic(() => import('@/components/player'), { ssr: false });

function ReciterContent() {
  const selectedReciter = useAtomValue(selectedReciterAtom);

  const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFullscreen]);

  /*   if (!selectedReciter) {
    // Still no selected reciter: show skeleton (prevents hydration mismatch)
    return <SimpleSkeleton />;
  } */

  return (
    <div className="flex w-full items-center justify-center p-4 md:p-6">
      <div className="flex w-full max-w-lg flex-col items-center justify-center gap-4">
        {process.env.NODE_ENV === 'development' && <DevTools />}
        {!isFullscreen && <ReciterSelector />}
        {isFullscreen && (
          <p className="mb-10 flex items-center justify-center gap-2 text-4xl font-bold text-gray-500">
            {selectedReciter?.name}
          </p>
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

export default function ReciterPage() {
  return (
    <Suspense fallback={<SimpleSkeleton />}>
      <ReciterContent />
    </Suspense>
  );
}
