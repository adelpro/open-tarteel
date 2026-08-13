'use client';

import { useEffect, useState } from 'react';

import { getSurahText } from '@/services/quran-text';
import type { SurahText } from '@/types';

type UseSurahTextResult = {
  surahText: SurahText | null;
  loading: boolean;
  error: string | null;
};

export function useSurahText(
  surahId: string | number | null | undefined
): UseSurahTextResult {
  const [surahText, setSurahText] = useState<SurahText | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surahId === null || surahId === undefined || surahId === '') {
      setSurahText(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    setLoading(true);
    setError(null);

    getSurahText(surahId)
      .then((data) => {
        if (!isMounted) return;
        setSurahText(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Failed to load surah text.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [surahId]);

  return { surahText, loading, error };
}
