'use client';

import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';

import { recentRecitersAtom, selectedReciterAtom } from '@/jotai/atoms';
import {
  addRecentReciter,
  DEFAULT_RECENT_TTL_MS,
  getRecentReciter,
  getRecentReciters,
  pruneAndRefreshRecentReciters,
  removeRecentReciter,
  touchRecentReciter,
} from '@/lib/recent-reciters/storage';
import type { LocaleType, RecentReciterEntry, Reciter } from '@/types';
import { generateFavId } from '@/utils';
import { getReciter } from '@/utils/api';

export interface UseRecentRecitersOptions {
  ttlMs?: number;
  keepOnError?: boolean;
}

export function useRecentReciters(options: UseRecentRecitersOptions = {}) {
  const { ttlMs = DEFAULT_RECENT_TTL_MS } = options;
  const { locale } = useIntl();
  const [recentReciters, setRecentReciters] = useAtom(recentRecitersAtom);

  const load = useCallback(async () => {
    // Background maintenance: refresh active expired entries, drop stale ones
    // Pass the API fetcher so storage can refresh data without knowing about hooks
    await pruneAndRefreshRecentReciters((id, entryLocale) =>
      getReciter(String(id), entryLocale as LocaleType)
    );
    const entries = await getRecentReciters(locale);
    setRecentReciters(entries);
  }, [locale, setRecentReciters]);

  useEffect(() => {
    load();
  }, [locale, load]);

  /**
   * Add a reciter to recent.
   * If already in recent (same id + locale): just update lastConsumedAt (touch).
   * If new: full add with data + TTL.
   */
  const add = useCallback(
    async (reciter: Reciter) => {
      const existing = await getRecentReciter(
        reciter.id,
        reciter.moshaf.id,
        locale
      );

      if (existing && existing.options.ttl > Date.now()) {
        // Already in recent and not expired → just touch (update lastConsumedAt)
        await touchRecentReciter(reciter.id, reciter.moshaf.id, locale);
        setRecentReciters((previous) =>
          previous.map((e) =>
            e.data.id === reciter.id && e.options.locale === locale
              ? {
                  ...e,
                  options: { ...e.options, lastConsumedAt: Date.now() },
                }
              : e
          )
        );
      } else {
        // New or expired → full add (resets TTL, updates data)
        await addRecentReciter(reciter, locale, ttlMs);
        setRecentReciters((previous) => {
          const filtered = previous.filter(
            (e) => !(e.data.id === reciter.id && e.options.locale === locale)
          );
          const newEntry: RecentReciterEntry = {
            data: reciter,
            cachedAt: Date.now(),
            options: {
              locale,
              ttl: Date.now() + ttlMs,
              lastConsumedAt: Date.now(),
              forceRefresh: false,
              keepOnError: true,
            },
          };
          return [newEntry, ...filtered];
        });
      }
    },
    [locale, ttlMs, setRecentReciters]
  );

  const remove = useCallback(
    async (
      reciterId: Reciter['id'],
      moshafId: Reciter['moshaf']['id'],
      allLocales = false
    ) => {
      await removeRecentReciter(
        reciterId,
        moshafId,
        allLocales ? undefined : locale
      );
      setRecentReciters((previous) => {
        if (allLocales) return previous.filter((e) => e.data.id !== reciterId);
        return previous.filter(
          (e) => !(e.data.id === reciterId && e.options.locale === locale)
        );
      });
    },
    [locale, setRecentReciters]
  );

  const clearLocale = useCallback(async () => {
    const all = await getRecentReciters();
    await Promise.all(
      all
        .filter((e) => e.options.locale === locale)
        .map((e) => removeRecentReciter(e.data.id, e.data.moshaf.id, locale))
    );
    setRecentReciters([]);
  }, [locale, setRecentReciters]);

  return {
    recentReciters,
    recentIds: recentReciters.map((e) => generateFavId(e.data)),
    add,
    remove,
    clearLocale,
    reload: load,
  };
}

export function useRecentRecitersData() {
  const recentRecitersEntities = useAtomValue(recentRecitersAtom);
  const recentIds = recentRecitersEntities.map((r) => generateFavId(r.data));
  const latestRecentReciter = recentRecitersEntities[0]?.data ?? null;
  return { recentRecitersEntities, recentIds, latestRecentReciter };
}

/**
 * Used on the reciter page where the reciter comes in as SSR props.
 * Responsibilities:
 *   1. Sync reciter into selectedReciterAtom if it changed
 *   2. Check if already in recent for this locale
 *      - Yes, not expired → touch (update lastConsumedAt only)
 *      - Yes, expired → add fresh (resets TTL + data)
 *      - No → add new entry
 *   3. Re-run when locale changes (same reciter in new locale = separate entry)
 */
export function useSyncReciter(reciter: Reciter | null | undefined) {
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const { locale } = useIntl();

  // Track last synced combination of id + moshafId + locale
  // so we don't re-run on unrelated re-renders
  const lastSyncedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!reciter) return;

    // locale is intentionally part of the key —
    // switching language while on the same reciter page should re-sync
    const incomingKey = `${reciter.id}::${reciter.moshaf?.id}::${locale}`;
    if (lastSyncedKey.current === incomingKey) return;
    lastSyncedKey.current = incomingKey;

    // 1. Sync into global selected state if different
    const isDifferent =
      selectedReciter?.id !== reciter.id ||
      selectedReciter?.moshaf?.id !== reciter.moshaf?.id;

    if (isDifferent) {
      setSelectedReciter(reciter);
    }

    // 2. Background: check recent cache and add/touch accordingly
    // getRecentReciter checks IDB directly (includes expired entries)
    getRecentReciter(reciter.id, reciter.moshaf.id, locale)
      .then((existing) => {
        const now = Date.now();

        if (existing && existing.options.ttl > now) {
          // Already in recent and valid → just update lastConsumedAt
          return touchRecentReciter(reciter.id, reciter.moshaf.id, locale);
        }

        // Not in recent, or expired → full add with fresh data from props
        // (We already have the data from SSR — no API call needed here)
        return addRecentReciter(reciter, locale);
      })
      .catch(() => {
        // non-fatal — recent reciters are a nice-to-have
      });
  }, [reciter?.id, reciter?.moshaf?.id, locale]); // eslint-disable-line react-hooks/exhaustive-deps
  // locale in deps → re-sync on language change
}
