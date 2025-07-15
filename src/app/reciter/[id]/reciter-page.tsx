'use client';

import 'jotai-devtools/styles.css';

import { useSetAtom } from 'jotai';
import { DevTools } from 'jotai-devtools';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import PwaUpdater from '@/components/pwa-updater';
import ReciterSelector from '@/components/reciter-selector';
import { selectedReciterAtom } from '@/jotai/atom';
import { getReciterFromApi } from '@/utils/api';

type Props = { id: number | undefined };
export default function ReciterPage({ id }: Props) {
  //TODO add loading and error
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const searchparams = useSearchParams();
  const moshafId = searchparams.get('moshafId');
  const Player = dynamic(() => import('@/components/player'), {
    ssr: false,
  });
  const setSelectedReciter = useSetAtom(selectedReciterAtom);

  // Fetch selected reciter
  useEffect(() => {
    if (!id) {
      setSelectedReciter(undefined);
      return;
    }

    if (!moshafId || Number.isNaN(moshafId)) {
      setSelectedReciter(undefined);
      return;
    }

    const loadReciter = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getReciterFromApi(id, Number(moshafId));
        if (data) {
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
    <div className="flex w-full items-center justify-center p-2 md:p-5">
      <div className="flex w-full max-w-lg flex-col items-center justify-center gap-2">
        <DevTools />
        <ReciterSelector />
        <Player />
        <PwaUpdater />
      </div>
    </div>
  );
}
