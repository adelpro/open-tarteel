import { atom } from 'jotai';

import type {
  BookmarkedTrack,
  RecentTrackKey,
  RecentTrackMeta,
  Track,
} from '@/types';

// ── Library (all tracks) ──────────────────────────────────────────────────────

export const libraryTracksAtom = atom<Track[]>([]);
export const libraryLoadingAtom = atom<boolean>(true);
export const libraryErrorAtom = atom<string | null>(null);
export const libraryHydratedAtom = atom<boolean>(false);

// ── Recent tracks ──────────────────────────────────────
export const recentTracksMetaAtom = atom<Map<RecentTrackKey, RecentTrackMeta>>(
  new Map()
);

// ── Bookmarks ─────────────────────────────────────────────────────────────────
// Synced via useBookmarksSync on app mount.
// Stored as Map<TrackId, BookmarkedTrack> for O(1) lookup, similar to recentTracksMetaAtom.
// Persistence handled by explicit idb-keyval reads/writes.
export const bookmarkedTracksAtom = atom<Map<Track['id'], BookmarkedTrack>>(
  new Map()
);

// ── Write atoms ───────────────────────────────────────────────────────────────

export const upsertLibraryTrackAtom = atom(null, (get, set, track: Track) => {
  const previous = get(libraryTracksAtom);
  const index = previous.findIndex((t) => t.id === track.id);
  set(
    libraryTracksAtom,
    index === -1
      ? [...previous, track]
      : previous.map((t) => (t.id === track.id ? track : t))
  );
});

export const removeLibraryTrackAtom = atom(null, (get, set, id: string) => {
  set(
    libraryTracksAtom,
    get(libraryTracksAtom).filter((t) => t.id !== id)
  );
});
