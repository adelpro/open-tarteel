import { CacheEntry, CacheOptions, DownloadStatus, PlayerTrack } from '@/types';

export interface Track extends PlayerTrack {
  reciterId: string;
  moshafId: string;

  // base-Info

  // Metadata
  surahName?: string;
  surahNameEn?: string;
  reciterName?: string;
  moshafName?: string;
  duration?: number;
  // Download state
  addedAt: number;
  status: DownloadStatus;
  progress: number; // 0-100
  speed?: number; // KB/s
  totalBytes: number;
  downloadedBytes: number;
}

/**
 * Composite key: `${reciterId}::${moshafId}::${surahId}`
 */
export type RecentTrackKey = Track['id'];
export type RecentTrackMeta = {
  lastConsumedAt: number; // ms — last actual play event (independent of TTL)
  cachedAt: number; // ms — when first added to recent
  ttl: number; // ms — expiry timestamp
};

// ── Track cache (library list) ──────────────────────────────────────

export type TrackCacheOptions = {
  ttl: number;
  forceRefresh: boolean;
  keepOnError: boolean;
};
export type TrackCachedEntry = CacheEntry<Track[], TrackCacheOptions>;

// ── Recent track entry ────────────────────────────────────────────────────────

type RecentTrackOptions = CacheOptions & {
  /**
   * Unix ms of last actual play/listen event.
   * Updated independently of TTL — a track can be "recent" without being
   * re-fetched, but if lastConsumedAt is old enough you can treat it as stale.
   */
  lastConsumedAt: number;
};

export type RecentTrackEntry = CacheEntry<Track, RecentTrackOptions>;

// ── Bookmark ──────────────────────────────────────────────────────────────────

export interface BookmarkedTrack {
  trackId: Track['id'];
  bookmarkedAt: number;
  note?: string;
}
