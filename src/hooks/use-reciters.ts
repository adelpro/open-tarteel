'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { Language } from '@/constants/language';
import { enabledSourcesAtom, selectedReciterAtom } from '@/jotai/atom';
import type { Reciter } from '@/types';
import { getAllReciters } from '@/utils/api';

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
        if (!isMounted) return;

        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cache = await caches.open('api-reciters');
            const keys = await cache.keys();
            const reciterKey = keys.find((request) =>
              request.url.includes('/api/reciters')
            );
            if (reciterKey) {
              const match = await cache.match(reciterKey);
              if (match && match.ok) {
                const cachedData = (await match.json()) as Reciter[];
                if (Array.isArray(cachedData) && cachedData.length > 0) {
                  setReciters(cachedData);
                  setError(null);
                  return;
                }
              }
            }
          } catch {
            // Fall through to error
          }
        }

        setError(
          locale === 'ar'
            ? 'فشل في تحميل القراء. يرجى المحاولة مرة أخرى.'
            : 'Failed to load reciters. Please try again.'
        );
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
