'use client';

import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { localeAtom, recitersCacheOptionsAtom } from '@/jotai/atoms';
import { isExpired } from '@/lib/reciters/storage';
import { CacheOptions } from '@/types';

import { useReciters } from './use-reciters';

/**
 * Mount this wherever you want the reciters list to stay in sync.
 * - Checks TTL on mount and on every locale change
 * - Triggers a background refetch if the cache has expired
 * - Does NOT block rendering — stale data is served while fetch runs
s
 * Usage:
 *   useSyncReciters()
 *   useSyncReciters({ ttl: 10 * 60 * 1000, keepOnError: false })
 */
export function useSyncReciters(options?: CacheOptions) {
  const cacheOptions = useAtomValue(recitersCacheOptionsAtom);
  const locale = useAtomValue(localeAtom);
  const { refetch } = useReciters(options);

  useEffect(() => {
    // On locale change (mid-session, without a full navigation):
    // useReciters' own effect handles initial hydration and locale-triggered refetches.
    // useSyncReciters adds a secondary TTL check so any component tree that
    // mounts this hook also keeps the list fresh — even if useReciters is
    // mounted elsewhere and its effect already ran.
    if (
      !cacheOptions ||
      isExpired({ options: cacheOptions, data: [], cachedAt: 0 }) ||
      locale !== cacheOptions.locale
    ) {
      refetch();
    }
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps
}
