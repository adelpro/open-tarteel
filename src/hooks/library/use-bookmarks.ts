'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

import { bookmarkedTracksAtom } from '@/jotai/library-atoms';
import {
  addBookmark,
  clearAllBookmarks,
  getBookmarks,
  removeBookmark,
} from '@/lib/tracks/storage';
import type { BookmarkedTrack, Track } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// useBookmarksSync — mount ONCE in layout
// Loads IDB → atom on mount. Similar to useRecentTracksSync.
// ─────────────────────────────────────────────────────────────────────────────

export function useBookmarksSync() {
  const setBookmarks = useSetAtom(bookmarkedTracksAtom);

  const hydrate = useCallback(async () => {
    const bookmarksMap = await getBookmarks();
    setBookmarks(bookmarksMap);
  }, [setBookmarks]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);
}

// ─────────────────────────────────────────────────────────────────────────────
// useBookmarks — owner, full read/write
// Provides bookmark management with idb-keyval persistence.
// Bookmarks stored as Map<TrackId, BookmarkedTrack> for O(1) lookup.
// ─────────────────────────────────────────────────────────────────────────────

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useAtom(bookmarkedTracksAtom);

  const bookmark = useCallback(
    async (trackId: Track['id'], note?: string) => {
      if (bookmarks.has(trackId)) return;

      const entry: BookmarkedTrack = {
        trackId,
        bookmarkedAt: Date.now(),
        note,
      };

      // Persist to idb-keyval
      await addBookmark(trackId, note);

      // Update atom
      setBookmarks((previous) => {
        const next = new Map(previous);
        next.set(trackId, entry);
        return next;
      });
    },
    [bookmarks, setBookmarks]
  );

  const unBookmark = useCallback(
    async (trackId: Track['id']) => {
      // Persist to idb-keyval
      await removeBookmark(trackId);

      // Update atom — track stays in library, only bookmark flag is cleared
      setBookmarks((previous) => {
        const next = new Map(previous);
        next.delete(trackId);
        return next;
      });
    },
    [setBookmarks]
  );

  const toggleBookmark = useCallback(
    async (trackId: Track['id'], note?: string) => {
      if (bookmarks.has(trackId)) {
        await unBookmark(trackId);
      } else {
        await bookmark(trackId, note);
      }
    },
    [bookmarks, bookmark, unBookmark]
  );

  const clearBookmarks = useCallback(async () => {
    await clearAllBookmarks();
    setBookmarks(new Map());
  }, [setBookmarks]);

  return {
    bookmarks,
    bookmark,
    unBookmark,
    toggleBookmark,
    clearBookmarks,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useBookmarksData — read-only
// For components that only need to read bookmark state without mutations.
// ─────────────────────────────────────────────────────────────────────────────

export function useBookmarksData() {
  const bookmarks = useAtomValue(bookmarkedTracksAtom);

  const isBookmarked = useCallback(
    (trackId: Track['id']) => bookmarks.has(trackId),
    [bookmarks]
  );

  return { bookmarks, isBookmarked };
}
