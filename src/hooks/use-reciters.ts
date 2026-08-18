'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { enabledSourcesAtom, selectedReciterAtom } from '@/jotai/atom';
import type { Reciter } from '@/types';
import { getAllReciters } from '@/utils/api';
import { Language } from '@/constants/language';

export function useReciters() {
  const locale = useIntl().locale as Language;
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const [enabledSources] = useAtom(enabledSourcesAtom);

  useEffect(() => {
    let isMounted = true;

    const fetchReciters = async () => {
      try {
        setLoading(true);
        const data = await getAllReciters(locale, enabledSources);
        if (!isMounted) return;

        setReciters(data);

        if (selectedReciter) {
          const matched = data.find((r) => r.id === selectedReciter.id);
          if (matched) {
            setSelectedReciter(matched);
          } else {
            setSelectedReciter(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only fetch on locale/sources change
  }, [locale, enabledSources, setSelectedReciter]);

  return { reciters, loading, error };
}
