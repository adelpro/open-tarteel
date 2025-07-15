'use client';

import { useAtom } from 'jotai';
import { DevTools } from 'jotai-devtools';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import PwaUpdater from '@/components/pwa-updater';
import ReciterSelector from '@/components/reciter-selector';
import SimpleSkeleton from '@/components/simple-skeleton';
import { selectedReciterAtom } from '@/jotai/atom';

export default function ReciterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Player = dynamic(() => import('@/components/player'), { ssr: false });
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);

  return (
    <div className="flex w-full items-center justify-center p-4 md:p-6">
      <div className="flex w-full max-w-lg flex-col items-center justify-center gap-4">
        <DevTools />
        <ReciterSelector />
        {loading && (
          <div className="w-full px-10">
            <SimpleSkeleton />
          </div>
        )}
        {error && (
          <p className="text-center font-semibold text-red-600">{error}</p>
        )}
        {selectedReciter && (
          <Player playlist={selectedReciter.moshaf.playlist} />
        )}
        <PwaUpdater />
      </div>
    </div>
  );
}
