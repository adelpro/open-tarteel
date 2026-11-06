export type DownloadProgress = {
  total: number;
  completed: number;
  failed: number;
  downloadedBytes: number;
  /** URL of the track currently being fetched */
  currentUrl: string | null;
  /** 0-1 fraction of the current single-track download */
  currentTrackProgress: number;
  /** Smoothed download speed in bytes/second */
  speedBps?: number;
  /** Estimated seconds remaining for the current track */
  etaSeconds?: number;
};

export type StorageEstimate = {
  usage: number;
  quota: number;
  available: number;
};

export type CachedMoshaf = {
  reciterName: string;
  moshafName: string;
  trackCount: number;
  totalBytes: number;
  /** Links belonging to this moshaf in the cache */
  links: string[];
};

/** Durable metadata stored in IndexedDB. */
export type OfflineDownloadRecord = {
  /** Exact audio URL used as the Cache API key. */
  url: string;
  reciterId?: string;
  moshafId?: string;
  reciterName?: string;
  moshafName?: string;
  surahId?: string;
  bytes: number;
  downloadedAt: number;
  backend?: 'cache' | 'cos';
};

export type OfflineErrorCode = 'quota' | 'network' | 'unknown' | null;
