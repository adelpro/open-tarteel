'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';

import { DOWNLOAD_STATUS } from '@/constants';
import {
  libraryErrorAtom,
  libraryHydratedAtom,
  libraryLoadingAtom,
  libraryTracksAtom,
  removeLibraryTrackAtom,
  upsertLibraryTrackAtom,
} from '@/jotai/library-atoms';
import {
  clearLibraryCache,
  isLibraryCacheExpired,
  readLibraryCache,
  removeTrackFromCache,
  upsertTrackInCache,
  writeLibraryCache,
} from '@/lib/tracks/storage';
import type { Track } from '@/types';

export interface UseLibraryOptions {
  ttlMs?: number;
  keepOnError?: boolean;
  forceRefresh?: boolean;
}

// ── useLibrarySync — mount once in layout ────────────────────────────────────
export function useLibraryHydration() {
  const setTracks = useSetAtom(libraryTracksAtom);
  const setHydrated = useSetAtom(libraryHydratedAtom);

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function hydrate() {
      // ── Phase 1: idb-keyval cache (instant) ──────────────────────────────
      try {
        const cache = await readLibraryCache();
        if (cache?.data?.length) {
          setTracks(cache.data);
          // Mark hydrated immediately so UI can render with stale-but-valid data
          setHydrated(true);
        }
      } catch {
        // Cache read failure is non-fatal — proceed to Phase 2
      }

      // ── Phase 2: SW TRACKS_STORE (background, authoritative) ─────────────
      // Don't block UI on this. setLoading only if cache was empty.
      let swTracks: Track[] = [];
      try {
        const { getAllTracks } = await import('@/lib/database/idb-utils');
        swTracks = await getAllTracks();
      } catch {
        // SW IDB unavailable (SSR, first load before SW activates, etc.)
        // Phase 1 data is sufficient. Mark hydrated and exit.
        setHydrated(true);
        return;
      }

      try {
        // Sanitize: any track stuck in DOWNLOADING means SW was killed mid-download.
        // AUDIO_STORE still has partial bytes, so PAUSED is correct (can resume).
        const sanitized = swTracks.map((t) =>
          t.status === DOWNLOAD_STATUS.DOWNLOADING
            ? { ...t, status: DOWNLOAD_STATUS.PAUSED }
            : t
        );

        // Re-read cache after Phase 1 to get latest (in case another tab wrote it)
        const latestCache = await readLibraryCache();

        // Merge: SW is authoritative for downloaded/in-progress tracks.
        // Keep played-but-not-downloaded tracks from cache (IDLE status, not in SW).
        const swIds = new Set(sanitized.map((t) => t.id));
        const playedOnly = (latestCache?.data ?? []).filter(
          (t) => !swIds.has(t.id) && t.status === DOWNLOAD_STATUS.IDLE
        );

        const merged = [...sanitized, ...playedOnly];

        await writeLibraryCache(merged, { keepOnError: true });
        setTracks(merged);
      } catch {
        // Merge/write failure — Phase 1 data is still in atom, that's fine
      } finally {
        setHydrated(true);
      }
    }

    void hydrate();

    // Intentionally no deps — run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// useLibrary — library PAGE only (or wherever manual reload is needed)
// ─────────────────────────────────────────────────────────────────────────────
/*  Full read/write. Call reload() for pull-to-refresh or error recovery.
    Does NOT auto-load on mount — useLibraryHydration handles boot hydration.
*/
export function useLibrary({
  keepOnError = true,
  forceRefresh = false,
}: UseLibraryOptions = {}) {
  const [tracks, setTracks] = useAtom(libraryTracksAtom);
  const [loading, setLoading] = useAtom(libraryLoadingAtom);
  const [error, setError] = useAtom(libraryErrorAtom);
  const [hydrated, setHydrated] = useAtom(libraryHydratedAtom);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const envelope = await readLibraryCache();

      // Stale-while-revalidate: show cached data immediately
      if (envelope?.data?.length) setTracks(envelope.data);

      const shouldRefresh =
        forceRefresh ||
        envelope?.options.forceRefresh ||
        !envelope?.data?.length ||
        isLibraryCacheExpired(envelope);

      if (shouldRefresh) {
        const { getAllTracks } = await import('@/lib/database/idb-utils');
        const swTracks = await getAllTracks();

        const sanitized = swTracks.map((t) =>
          t.status === DOWNLOAD_STATUS.DOWNLOADING
            ? { ...t, status: DOWNLOAD_STATUS.PAUSED }
            : t
        );

        const swIds = new Set(sanitized.map((t) => t.id));
        const playedOnly = (envelope?.data ?? []).filter(
          (t) => !swIds.has(t.id) && t.status === DOWNLOAD_STATUS.IDLE
        );

        const merged = [...sanitized, ...playedOnly];
        await writeLibraryCache(merged, { keepOnError });
        setTracks(merged);
      }
    } catch {
      setError('Failed to load library.');
      if (!keepOnError) {
        await clearLibraryCache();
        setTracks([]);
      }
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, [forceRefresh, keepOnError, setTracks, setLoading, setError, setHydrated]);

  return {
    tracks,
    loading: loading || !hydrated,
    error,
    reload,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useLibraryData — any component that reads tracks
// ─────────────────────────────────────────────────────────────────────────────
//
/** Read-only. Zero side effects. Use in any list-rendered component. */
export function useLibraryData() {
  const isHydrated = useAtomValue(libraryHydratedAtom);
  return {
    tracks: useAtomValue(libraryTracksAtom),
    loading: useAtomValue(libraryLoadingAtom) || !isHydrated,
    error: useAtomValue(libraryErrorAtom),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTrackSync — download manager only
// ─────────────────────────────────────────────────────────────────────────────
// Write-through: atom update + idb-keyval cache in one call.
// Called by useDownloadManager on every SW progress message.
export function useTrackSync() {
  const upsert = useSetAtom(upsertLibraryTrackAtom);
  const remove = useSetAtom(removeLibraryTrackAtom);

  const syncTrack = useCallback(
    async (track: Track) => {
      upsert(track); // instant atom update
      await upsertTrackInCache(track); // write-through to idb-keyval
    },
    [upsert]
  );

  const removeTrack = useCallback(
    async (id: Track['id']) => {
      remove(id);
      await removeTrackFromCache(id);
    },
    [remove]
  );

  return { syncTrack, removeTrack };
}
