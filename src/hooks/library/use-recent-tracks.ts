'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';

import { DEFAULT_RECENT_TTL_MS } from '@/constants';
import {
  libraryTracksAtom,
  recentTracksMetaAtom,
  upsertLibraryTrackAtom,
} from '@/jotai';
import {
  clearAllRecent,
  getRecentTracksMeta,
  markTrackAsRecent,
  pruneExpiredRecentTracks,
  removeFromRecent,
  touchRecentTrack,
  upsertTrackInCache,
} from '@/lib/tracks/storage';
import { RecentTrackMeta, Track } from '@/types';

// ── useRecentTracks ───────────────────────────────────────────────────────────

export interface UseRecentTracksOptions {
  ttlMs?: number;
  stalerThan?: number;
}

export interface UseRecentTracksSyncOptions {
  ttlMs?: number;
  stalerThan?: number;
}
// ─────────────────────────────────────────────────────────────────────────────
// useRecentTracksSync — mount ONCE in layout
// Loads IDB → atom on mount. Auto-prunes expired entries.
// ─────────────────────────────────────────────────────────────────────────────

export function useRecentTracksSync({
  stalerThan,
}: { stalerThan?: number } = {}) {
  const setRecentMeta = useSetAtom(recentTracksMetaAtom);

  const hydrate = useCallback(async () => {
    await pruneExpiredRecentTracks();
    const metas = await getRecentTracksMeta(stalerThan);
    setRecentMeta(metas);
  }, [stalerThan, setRecentMeta]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared derivation — used by both owner and read-only hooks
// ─────────────────────────────────────────────────────────────────────────────

function deriveRecentTracks(
  libraryTracks: Track[],
  recentMetas: Map<Track['id'], RecentTrackMeta>
): Track[] {
  return [...libraryTracks]
    .filter((t) => recentMetas.has(t.id))
    .sort((a, b) => {
      const ma = recentMetas.get(a.id)?.lastConsumedAt ?? 0;
      const mb = recentMetas.get(b.id)?.lastConsumedAt ?? 0;
      return mb - ma; // newest-first
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// useRecentTracks — owner, full read/write
// Mount in Player (rendered once). Exposes markPlayed for audio onPlay.
// ─────────────────────────────────────────────────────────────────────────────

export function useRecentTracks() {
  const upsertLibrary = useSetAtom(upsertLibraryTrackAtom);
  const setRecentMetas = useSetAtom(recentTracksMetaAtom);

  /**
   * Call when a track starts playing (audio onPlay) OR when selected from playlist.
   * Safe to call multiple times for the same track — it's an upsert.
   *
   * Does two things:
   *   1. Upserts track into libraryTracksAtom (single truth)
   *   2. Marks track ID as recent in recentTracksMetaAtom + idb-keyval
   */
  const markPlayed = useCallback(
    async (track: Track, ttlMs = DEFAULT_RECENT_TTL_MS) => {
      const now = Date.now();

      upsertLibrary(track);
      await upsertTrackInCache({ ...track, addedAt: track.addedAt || now });
      await markTrackAsRecent(track.id, ttlMs);

      setRecentMetas((previous) => {
        const next = new Map(previous);
        const existing = previous.get(track.id);
        next.set(track.id, {
          lastConsumedAt: now,
          cachedAt: existing?.cachedAt ?? now,
          ttl: now + ttlMs,
        });
        return next;
      });
    },
    [upsertLibrary, setRecentMetas]
  );
  /**
   * Bump lastConsumedAt on seek/resume without full re-add.
   */
  const touchPlayed = useCallback(
    async (trackId: Track['id']) => {
      await touchRecentTrack(trackId);
      setRecentMetas((previous) => {
        const entry = previous.get(trackId);
        if (!entry) return previous;
        const next = new Map(previous);
        next.set(trackId, { ...entry, lastConsumedAt: Date.now() });
        return next;
      });
    },
    [setRecentMetas]
  );
  /**
   * Remove one track from recent.
   * Track stays in library — only clears the recent flag.
   */
  const removeRecent = useCallback(
    async (trackId: Track['id']) => {
      await removeFromRecent(trackId);
      setRecentMetas((previous) => {
        const next = new Map(previous);
        next.delete(trackId);
        return next;
      });
    },
    [setRecentMetas]
  );

  /**
   * Clear all recent history.
   * All tracks stay in library — only recent flags are cleared.
   * Use in Settings → "Clear recent history".
   */
  const clearRecent = useCallback(async () => {
    await clearAllRecent();
    setRecentMetas(new Map());
  }, [setRecentMetas]);

  return {
    markPlayed,
    touchPlayed,
    removeRecent,
    clearRecent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useRecentTracksData — read-only + write actions, use anywhere
// No mount restriction. Safe in list-rendered components, settings, etc.
// ─────────────────────────────────────────────────────────────────────────────

export function useRecentTracksData() {
  const recentMetas = useAtomValue(recentTracksMetaAtom);
  const libraryTracks = useAtomValue(libraryTracksAtom);

  const recentTracks = useMemo(
    () => deriveRecentTracks(libraryTracks, recentMetas),
    [libraryTracks, recentMetas]
  );

  const recentTrackIds = useMemo(
    () => new Set(recentMetas.keys()),
    [recentMetas]
  );

  const isRecentlyPlayed = useCallback(
    (trackId: Track['id'], stalerThan?: number) => {
      const meta = recentMetas.get(trackId);
      if (!meta) return false;
      if (!stalerThan) return true;
      return Date.now() - meta.lastConsumedAt <= stalerThan;
    },
    [recentMetas]
  );

  return {
    recentTracks,
    recentTrackIds,
    isRecentlyPlayed,
  };
}
