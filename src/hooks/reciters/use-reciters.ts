'use client';

import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';

import { getMessageConfig } from '@/helpers';
import {
  recitersAtom,
  recitersCacheOptionsAtom,
  recitersErrorAtom,
  recitersHydratedAtom,
  recitersLoadingAtom,
} from '@/jotai/atoms';
import {
  buildEnvelope,
  clearCache,
  isExpired,
  readCache,
  writeCache,
} from '@/lib/reciters/storage';
import type { CacheOptions, LocaleType } from '@/types';
import { getAllReciters } from '@/utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// Hook options
// ─────────────────────────────────────────────────────────────────────────────

// useReciters — owns fetching, hydration, and revalidation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Use this at the TOP of your tree (page or layout level).
 * Nested components should use `useRecitersData()` — no fetch, no side effects.
 */
export function useReciters(options?: CacheOptions) {
  const { ttl, forceRefresh = false, keepOnError = true } = options || {};

  const { locale, formatMessage } = useIntl();

  const [reciters, setReciters] = useAtom(recitersAtom);
  const [loading, setLoading] = useAtom(recitersLoadingAtom);
  const [error, setError] = useAtom(recitersErrorAtom);
  const [hydrated, setHydrated] = useAtom(recitersHydratedAtom);
  const setCacheOptions = useSetAtom(recitersCacheOptionsAtom);

  const isMounted = useRef(true);

  const errorMessage = formatMessage(getMessageConfig('error.fetchReciters'));

  // ── Core fetch + write-through ─────────────────────────────────────────────
  const fetchAndCache = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const freshData = await getAllReciters(locale as LocaleType);
      if (!isMounted.current) return;

      const envelope = buildEnvelope(freshData, {
        forceRefresh: false,
        keepOnError,
        locale,
        ...(ttl ? { ttl: Date.now() + ttl } : {}),
      });

      await writeCache(envelope);
      setReciters(freshData);
      setCacheOptions(envelope.options);
    } catch {
      if (!isMounted.current) return;

      setError(errorMessage);

      if (!keepOnError) {
        await clearCache();
        setReciters([]);
        setCacheOptions(null);
      }
      // keepOnError = true (default) -> IDB + atom untouched, old data stays
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [
    locale,
    keepOnError,
    errorMessage,
    ttl,
    setReciters,
    setLoading,
    setError,
    setCacheOptions,
  ]);

  // ── Hydrate from IDB, then decide if a fetch is needed ────────────────────
  useEffect(() => {
    isMounted.current = true;

    async function hydrate() {
      const envelope = await readCache();

      if (!isMounted.current) return;

      if (envelope?.data?.length) {
        // Stale-while-revalidate: serve cached data immediately, no UI flicker
        setReciters(envelope.data);
        setCacheOptions(envelope.options);
      }

      setHydrated(true);

      const shouldFetch =
        forceRefresh ||
        envelope?.options.forceRefresh ||
        !envelope?.data?.length ||
        isExpired(envelope);

      if (shouldFetch) {
        await fetchAndCache();
      }
    }

    hydrate();

    return () => {
      isMounted.current = false;
    };
    // Locale change -> always re-hydrate + refetch (API returns locale-specific data)
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => fetchAndCache(), [fetchAndCache]);

  return { reciters, loading: loading || !hydrated, error, refetch };
}
