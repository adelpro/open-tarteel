'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { Language } from '@/constants/language';
import { enabledSourcesAtom, selectedReciterAtom } from '@/jotai/atom';
import type { LinkSource, Reciter } from '@/types';
import { getAllReciters } from '@/utils/api';

type InFlightRequest = {
  key: string;
  promise: Promise<Reciter[]>;
};

// HomeClient and RecitersList both call this hook, and the selector dialog is
// mounted even while closed. Share one request per locale/sources combination
// so the catalog is fetched once instead of twice.
let inFlightReciters: InFlightRequest | null = null;

const requestKey = (locale: Language, sources: readonly string[]) =>
  `${locale}:${[...sources].sort().join(',')}`;

const loadReciters = (
  locale: Language,
  sources: readonly LinkSource[]
): Promise<Reciter[]> => {
  const key = requestKey(locale, sources);
  if (inFlightReciters?.key === key) return inFlightReciters.promise;

  const promise = getAllReciters(locale, [...sources]).finally(() => {
    if (inFlightReciters?.promise === promise) inFlightReciters = null;
  });
  inFlightReciters = { key, promise };
  return promise;
};

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
        const data = await loadReciters(locale, enabledSources);
        if (!isMounted) return;

        setReciters(data);

        if (selectedReciter) {
          // A reciter can have several moshaf/riwayah entries. Only the exact
          // selected moshaf may refresh it; any other entry for the same
          // reciter must not replace the user's persisted choice.
          const matched = data.find(
            (r) =>
              r.id === selectedReciter.id &&
              r.moshaf.id === selectedReciter.moshaf.id
          );
          if (matched) {
            // Do not throw away a lazily loaded playlist (or a persisted one)
            // when the catalog refreshes with an empty playlist. If the user
            // picked another reciter while this request was in flight, leave
            // the newer choice alone.
            setSelectedReciter((previous) => {
              if (
                !previous ||
                previous.id !== selectedReciter.id ||
                previous.moshaf.id !== selectedReciter.moshaf.id
              ) {
                return previous;
              }
              if (
                matched.moshaf.playlist.length === 0 &&
                previous.moshaf.playlist.length > 0
              ) {
                return {
                  ...matched,
                  moshaf: {
                    ...matched.moshaf,
                    playlist: previous.moshaf.playlist,
                    surah_total: previous.moshaf.surah_total,
                  },
                };
              }
              return matched;
            });
          } else if (!data.some((r) => r.id === selectedReciter.id)) {
            setSelectedReciter((previous) =>
              previous?.id === selectedReciter.id ? null : previous
            );
          }
        }
      } catch {
        if (!isMounted) return;

        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cache = await caches.open('api-reciters-v3');
            const params = new URLSearchParams({ language: locale });
            if (enabledSources.length > 0) {
              params.set('sources', enabledSources.join(','));
            }
            const reciterUrl = new URL(
              `/api/reciters?${params.toString()}`,
              window.location.origin
            ).href;
            const match = await cache.match(reciterUrl);
            if (match && match.ok) {
              const cachedData = (await match.json()) as Reciter[];
              if (Array.isArray(cachedData) && cachedData.length > 0) {
                setReciters(cachedData);
                setError(null);
                return;
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
