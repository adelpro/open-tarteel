import { get, set } from 'idb-keyval';

import type { RecentReciterEntry, RecentReciterKey, Reciter } from '@/types';
import { makeRecentReciterKey } from '@/utils';

import { createCacheOptions } from '../utils';

const CACHE_KEY = 'recent_reciters';

export const DEFAULT_RECENT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * If lastConsumedAt is within this span of now, the entry is considered
 * "actively used" when it expires → try to refresh instead of drop.
 * If lastConsumedAt is older than this → drop the entry entirely.
 */
export const RECENT_ACTIVE_SPAN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const MAX_RECENT = 20;

// ── Internal ──────────────────────────────────────────────────────────────────

async function readMap(): Promise<Map<RecentReciterKey, RecentReciterEntry>> {
  try {
    const stored =
      await get<[RecentReciterKey, RecentReciterEntry][]>(CACHE_KEY);
    if (!stored) return new Map();
    return new Map(stored);
  } catch {
    return new Map();
  }
}

async function writeMap(
  map: Map<RecentReciterKey, RecentReciterEntry>
): Promise<void> {
  try {
    await set(CACHE_KEY, [...map.entries()]);
  } catch {
    // non-fatal
  }
}

// ── Public: add / upsert ──────────────────────────────────────────────────────

/**
 * Add or update a reciter in recent.
 *
 * - Same id + same locale → upsert: update data + lastConsumedAt + reset TTL
 * - Same id + diff locale → separate entry (different key)
 * - Trims to MAX_RECENT (oldest lastConsumedAt removed first)
 */
export async function addRecentReciter(
  reciter: Reciter,
  locale: string,
  ttlMs = DEFAULT_RECENT_TTL_MS
): Promise<void> {
  const map = await readMap();
  const key = makeRecentReciterKey(reciter.id, reciter.moshaf.id, locale);
  const existing = map.get(key);
  const now = Date.now();

  map.set(key, {
    data: reciter,
    // Only reset cachedAt if this is a genuinely new entry or a full refresh
    cachedAt: existing?.cachedAt ?? now,
    options: createCacheOptions({ locale }, ttlMs),
  });

  if (map.size > MAX_RECENT) {
    const sorted = [...map.entries()].sort(
      ([, a], [, b]) => a.options.lastConsumedAt - b.options.lastConsumedAt
    );
    for (const [k] of sorted.slice(0, map.size - MAX_RECENT)) map.delete(k);
  }

  await writeMap(map);
}

/**
 * Only update lastConsumedAt without touching data or TTL.
 * Use this when the reciter is already in recent and you just want to
 * record that it was viewed again.
 */
export async function touchRecentReciter(
  reciterId: Reciter['id'],
  moshafId: Reciter['moshaf']['id'],
  locale: string
): Promise<void> {
  const map = await readMap();
  const key = makeRecentReciterKey(reciterId, moshafId, locale);
  const existing = map.get(key);
  if (!existing) return;

  map.set(key, {
    ...existing,
    options: {
      ...existing.options,
      lastConsumedAt: Date.now(),
    },
  });

  await writeMap(map);
}

// ── Public: remove ────────────────────────────────────────────────────────────

export async function removeRecentReciter(
  reciterId: Reciter['id'],
  moshafId?: Reciter['moshaf']['id'],
  locale?: string
): Promise<void> {
  const map = await readMap();

  if (locale && moshafId) {
    map.delete(makeRecentReciterKey(reciterId, moshafId, locale));
    return;
  }

  const prefix = moshafId ? `${reciterId}::${moshafId}` : `${reciterId}::`;

  for (const key of map.keys()) {
    if (key.startsWith(prefix)) {
      map.delete(key);
    }
  }

  await writeMap(map);
}

// ── Public: read ──────────────────────────────────────────────────────────────

/**
 * Read non-expired entries, optionally filtered by locale.
 * Returns newest-first by lastConsumedAt.
 * Expired entries are NOT returned — use pruneAndRefresh to handle them.
 */
export async function getRecentReciters(
  locale?: string
): Promise<RecentReciterEntry[]> {
  const map = await readMap();
  const now = Date.now();

  return [...map.values()]
    .filter((entry) => {
      if (entry.options.ttl < now) return false;
      if (locale && entry.options.locale !== locale) return false;
      return true;
    })
    .sort((a, b) => b.options.lastConsumedAt - a.options.lastConsumedAt);
}

/**
 * Get a single entry by id + locale (including expired ones).
 * Used by useSyncReciter to check if entry exists before deciding to add or touch.
 */
export async function getRecentReciter(
  reciterId: Reciter['id'],
  moshafId: Reciter['moshaf']['id'],
  locale: string
): Promise<RecentReciterEntry | null> {
  const map = await readMap();
  return map.get(makeRecentReciterKey(reciterId, moshafId, locale)) ?? null;
}

// ── Public: smart prune ───────────────────────────────────────────────────────

/**
 * Background maintenance for all entries.
 *
 * For each EXPIRED entry:
 *   - If lastConsumedAt is within RECENT_ACTIVE_SPAN → entry was recently used
 *     → call fetchFn to try a refresh
 *       - success: update data + reset TTL (keep in recent)
 *       - fail:    keep old data, update lastConsumedAt only (still in recent)
 *   - If lastConsumedAt is outside RECENT_ACTIVE_SPAN → stale, not worth keeping
 *     → remove from IDB entirely
 *
 * Non-expired entries are untouched.
 *
 * @param fetchFn  Your API call: (id, locale) => Promise<Reciter | null>
 */
export async function pruneAndRefreshRecentReciters(
  fetchFunction: (
    id: string | number,
    locale: string
  ) => Promise<Reciter | null>
): Promise<void> {
  const map = await readMap();
  const now = Date.now();
  let changed = false;

  for (const [key, entry] of map.entries()) {
    const isExpired = entry.options.ttl < now;
    if (!isExpired) continue; // not expired, leave it alone

    const isActivelyUsed =
      now - entry.options.lastConsumedAt < RECENT_ACTIVE_SPAN_MS;

    if (!isActivelyUsed) {
      // Stale and not recently used → drop it
      map.delete(key);
      changed = true;
      continue;
    }

    // Expired but recently used → try to refresh
    try {
      const fresh = await fetchFunction(entry.data.id, entry.options.locale);
      if (fresh) {
        // Refresh succeeded → update data + reset TTL
        map.set(key, {
          data: fresh,
          cachedAt: now,
          options: {
            ...entry.options,
            ttl: now + DEFAULT_RECENT_TTL_MS,
            lastConsumedAt: now,
          },
        });
      } else {
        // API returned null → treat as not found, drop entry
        map.delete(key);
      }
    } catch {
      // Refresh failed (offline etc.) → keep old data, just update lastConsumedAt
      map.set(key, {
        ...entry,
        options: {
          ...entry.options,
          lastConsumedAt: now, // mark that we tried at this time
        },
      });
    }

    changed = true;
  }

  if (changed) await writeMap(map);
}
