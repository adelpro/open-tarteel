import { del, get, set } from 'idb-keyval';

import {
  DEFAULT_RECENT_TTL_MS,
  DEFAULT_TRACK_TTL_MS,
  MAX_RECENT_TRACKS,
  TRACKS_CACHE_KEYS,
} from '@/constants/tracks';
import type {
  BookmarkedTrack,
  RecentTrackKey,
  RecentTrackMeta,
  Track,
  TrackCachedEntry,
  TrackCacheOptions,
} from '@/types';

import { createCacheOptions } from '../utils';

// ─────────────────────────────────────────────────────────────────────────────
// Library cache
// ─────────────────────────────────────────────────────────────────────────────

export async function readLibraryCache(): Promise<TrackCachedEntry | null> {
  try {
    return (await get<TrackCachedEntry>(TRACKS_CACHE_KEYS.LIBRARY)) ?? null;
  } catch {
    return null;
  }
}

export async function writeLibraryCache(
  tracks: Track[],
  options: Partial<TrackCacheOptions> = {}
): Promise<TrackCachedEntry> {
  const envelope: TrackCachedEntry = {
    data: tracks,
    cachedAt: Date.now(),
    options: createCacheOptions(options, DEFAULT_TRACK_TTL_MS),
  };
  try {
    await set(TRACKS_CACHE_KEYS.LIBRARY, envelope);
  } catch {
    // non-fatal
  }
  return envelope;
}

export async function clearLibraryCache(): Promise<void> {
  try {
    await del(TRACKS_CACHE_KEYS.LIBRARY);
  } catch {
    // non-fatal
  }
}

export function isLibraryCacheExpired(envelope: TrackCachedEntry): boolean {
  return Date.now() > envelope.options.ttl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual track upsert (called after download status changes)
// Keeps the library cache in sync without a full reload.
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertTrackInCache(track: Track): Promise<void> {
  const envelope = await readLibraryCache();

  if (!envelope) {
    await writeLibraryCache([track]);
    return;
  }

  const index = envelope.data.findIndex((t) => t.id === track.id);
  const updated =
    index === -1
      ? [...envelope.data, track]
      : envelope.data.map((t) => (t.id === track.id ? track : t));

  await writeLibraryCache(updated, envelope.options);
}

export async function removeTrackFromCache(id: Track['id']): Promise<void> {
  const envelope = await readLibraryCache();
  if (!envelope) return;
  await writeLibraryCache(
    envelope.data.filter((t) => t.id !== id),
    envelope.options
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent tracks
// ─────────────────────────────────────────────────────────────────────────────

async function readRecentMap(): Promise<Map<RecentTrackKey, RecentTrackMeta>> {
  try {
    const stored = await get<[RecentTrackKey, RecentTrackMeta][]>(
      TRACKS_CACHE_KEYS.RECENT
    );
    return stored ? new Map(stored) : new Map();
  } catch {
    return new Map();
  }
}

async function writeRecentMap(
  map: Map<RecentTrackKey, RecentTrackMeta>
): Promise<void> {
  try {
    await set(TRACKS_CACHE_KEYS.RECENT, [...map.entries()]);
  } catch {
    // non-fatal
  }
}
// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Mark a track as recently played (upsert).
 * - If exists: updates lastConsumedAt, refreshes TTL
 * - If new: creates entry, then trims by LEAST recently consumed (not by add time)
 */
export async function markTrackAsRecent(
  trackId: Track['id'],
  ttlMs = DEFAULT_RECENT_TTL_MS
): Promise<void> {
  const map = await readRecentMap();
  const now = Date.now();
  const existing = map.get(trackId);

  map.set(trackId, {
    lastConsumedAt: now,
    cachedAt: existing?.cachedAt ?? now,
    ttl: now + ttlMs,
  });

  if (map.size > MAX_RECENT_TRACKS) {
    const sorted = [...map.entries()].sort(
      ([, a], [, b]) => a.lastConsumedAt - b.lastConsumedAt
    );
    for (const [k] of sorted.slice(0, map.size - MAX_RECENT_TRACKS)) {
      map.delete(k);
    }
  }

  await writeRecentMap(map);
}

/**
 * Bump lastConsumedAt on seek/resume without refreshing TTL or re-adding.
 */
export async function touchRecentTrack(trackId: Track['id']): Promise<void> {
  const map = await readRecentMap();
  const entry = map.get(trackId);
  if (!entry) return;
  map.set(trackId, { ...entry, lastConsumedAt: Date.now() });
  await writeRecentMap(map);
}
/**
 * Remove one track from recent.
 * Track stays in library — this only clears the recent flag.
 */
export async function removeFromRecent(trackId: Track['id']): Promise<void> {
  const map = await readRecentMap();
  if (!map.has(trackId)) return;
  map.delete(trackId);
  await writeRecentMap(map);
}

/**
 * Clear entire recent history.
 * Tracks stay in library — only recent flags are cleared.
 */
export async function clearAllRecent(): Promise<void> {
  try {
    await del(TRACKS_CACHE_KEYS.RECENT);
  } catch {
    // no fetal
  }
}

/**
 * Remove expired entries. Called on app mount via useRecentTracksSync.
 */
export async function pruneExpiredRecentTracks(): Promise<void> {
  const map = await readRecentMap();
  const now = Date.now();
  let changed = false;

  for (const [key, meta] of map.entries()) {
    if (meta.ttl < now) {
      map.delete(key);
      changed = true;
    }
  }

  if (changed) await writeRecentMap(map);
}

/**
 * Read recent metas, sorted newest-first.
 * stalerThan: optional — exclude tracks not played within N ms.
 */
export async function getRecentTracksMeta(
  stalerThan?: number
): Promise<Map<RecentTrackKey, RecentTrackMeta>> {
  const map = await readRecentMap();
  const now = Date.now();
  const result = new Map<RecentTrackKey, RecentTrackMeta>();

  // Sort newest-first before building result map
  const sorted = [...map.entries()].sort(
    ([, a], [, b]) => b.lastConsumedAt - a.lastConsumedAt
  );

  for (const [key, meta] of sorted) {
    if (meta.ttl < now) continue;
    if (stalerThan && now - meta.lastConsumedAt > stalerThan) continue;
    result.set(key, meta);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookmarks
// ─────────────────────────────────────────────────────────────────────────────

async function readBookmarksMap(): Promise<Map<Track['id'], BookmarkedTrack>> {
  try {
    const stored = await get<[Track['id'], BookmarkedTrack][]>(
      TRACKS_CACHE_KEYS.BOOKMARKS
    );
    return stored ? new Map(stored) : new Map();
  } catch {
    return new Map();
  }
}

async function writeBookmarksMap(
  map: Map<string, BookmarkedTrack>
): Promise<void> {
  try {
    await set(TRACKS_CACHE_KEYS.BOOKMARKS, [...map.entries()]);
  } catch {
    // non-fatal
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getBookmarks(): Promise<
  Map<Track['id'], BookmarkedTrack>
> {
  return readBookmarksMap();
}

export async function addBookmark(
  trackId: Track['id'],
  note?: string
): Promise<void> {
  const map = await readBookmarksMap();
  if (map.has(trackId)) return;

  map.set(trackId, { trackId, bookmarkedAt: Date.now(), note });
  await writeBookmarksMap(map);
}

export async function removeBookmark(trackId: Track['id']): Promise<void> {
  const map = await readBookmarksMap();
  if (!map.has(trackId)) return;
  map.delete(trackId);
  await writeBookmarksMap(map);
}

export async function isBookmarked(trackId: Track['id']): Promise<boolean> {
  const map = await readBookmarksMap();
  return map.has(trackId);
}

export async function clearAllBookmarks(): Promise<void> {
  try {
    await del(TRACKS_CACHE_KEYS.BOOKMARKS);
  } catch {
    // non-fatal
  }
}
