'use client';

import { useAtom } from 'jotai';
import { DevTools } from 'jotai-devtools';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import PwaUpdater from '@/components/pwa-updater';
import ReciterSelector from '@/components/reciter-selector';
import SimpleSkeleton from '@/components/simple-skeleton';
import { selectedReciterAtom } from '@/jotai/atom';
import { getReciter } from '@/utils/api';

type Props = { id: number | undefined };
export default function ReciterPage({ id }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchparams = useSearchParams();
  const moshafId = searchparams.get('moshafId');
  const Player = dynamic(() => import('@/components/player'), { ssr: false });
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);

  useEffect(() => {
    if (!id) {
      setSelectedReciter(undefined);
      return;
    }

    if (!moshafId || Number.isNaN(Number(moshafId))) {
      setSelectedReciter(undefined);
      return;
    }

    const loadReciter = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getReciter(id, Number(moshafId));
        if (!data) {
          setSelectedReciter(undefined);
          return;
        }
        setSelectedReciter(data);
      } catch (error_) {
        setError('فشل في التحميل . يرجى المحاولة مرة أخرى.');
        console.error('Error loading reciters:', error_);
      } finally {
        setLoading(false);
      }
    };

    loadReciter();
  }, [id, moshafId, setSelectedReciter]);

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
