'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { selectedReciterAtom } from '@/jotai/atom';
import type { Reciter } from '@/types';
import { getAllReciters } from '@/utils/api';

export function useReciters() {
  const locale = useIntl().locale as 'ar' | 'en';
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);

  useEffect(() => {
    let isMounted = true;

    const fetchReciters = async () => {
      try {
        setLoading(true);
        const data = await getAllReciters(locale);
        if (!isMounted) return;

        setReciters(data);

        if (selectedReciter) {
          const matched = data.find((r) => r.id === selectedReciter.id);
          if (matched) {
            setSelectedReciter(matched); // Update with fresh data
          } else {
            console.warn(
              '[useReciters] Clearing invalid reciter ID:',
              selectedReciter.id
            );
            setSelectedReciter(null); // Clear invalid reciter
          }
        }
      } catch {
        if (isMounted) {
          setError(
            locale === 'ar'
              ? 'فشل في تحميل القراء. يرجى المحاولة مرة أخرى.'
              : 'Failed to load reciters. Please try again.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReciters();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only fetch on locale change to avoid skeleton flicker
  }, [locale, setSelectedReciter]);

  return { reciters, loading, error };
}
