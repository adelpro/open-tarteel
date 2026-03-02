export const TRACKS_CACHE_KEYS = {
  LIBRARY: 'tracks_library',
  RECENT: 'tracks_recent',
  BOOKMARKS: 'tracks_bookmarks',
} as const;

export const DEFAULT_TRACK_TTL_MS = 60 * 60 * 1000; // 1 hour
export const DEFAULT_RECENT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const MAX_RECENT_TRACKS = 50;
