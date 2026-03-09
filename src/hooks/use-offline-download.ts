'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Playlist } from '@/types';

const OFFLINE_CACHE = 'quran-offline-downloads';

export type DownloadProgress = {
  total: number;
  completed: number;
  failed: number;
  downloadedBytes: number;
  /** URL of the track currently being fetched */
  currentUrl: string | null;
  /** 0-1 fraction of the current single-track download */
  currentTrackProgress: number;
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

export function useOfflineDownload() {
  const [cachedUrls, setCachedUrls] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [singleTrackLoading, setSingleTrackLoading] = useState<string | null>(
    null
  );
  const [singleTrackProgress, setSingleTrackProgress] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const singleAbortRef = useRef<AbortController | null>(null);

  const refreshCachedUrls = useCallback(async () => {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(OFFLINE_CACHE);
      const keys = await cache.keys();
      setCachedUrls(new Set(keys.map((r) => r.url)));
    } catch {
      // Cache API not available
    }
  }, []);

  useEffect(() => {
    refreshCachedUrls();
  }, [refreshCachedUrls]);

  // ── Helper: fetch with progress via ReadableStream ──
  const fetchWithProgress = useCallback(
    async (
      url: string,
      signal: AbortSignal,
      onProgress?: (received: number, total: number) => void
    ): Promise<Response | null> => {
      const response = await fetch(url, { mode: 'cors', signal });
      if (!response.ok) return null;

      const contentLength = Number(response.headers.get('content-length')) || 0;
      if (!response.body || !contentLength) {
        // Can't stream — just return the response as-is
        return response;
      }

      const reader = response.body.getReader();
      const chunks: ArrayBuffer[] = [];
      let received = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value.buffer as ArrayBuffer);
        received += value.length;
        onProgress?.(received, contentLength);
      }

      const blob = new Blob(chunks);
      return new Response(blob, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    },
    []
  );

  // ── Download a single track (with loading indicator + progress) ─
  const downloadTrack = useCallback(
    async (url: string): Promise<boolean> => {
      if (!('caches' in window)) return false;
      try {
        const cache = await caches.open(OFFLINE_CACHE);
        const existing = await cache.match(url);
        if (existing) return true;

        singleAbortRef.current?.abort();
        const controller = new AbortController();
        singleAbortRef.current = controller;

        setSingleTrackLoading(url);
        setSingleTrackProgress(0);

        const response = await fetchWithProgress(
          url,
          controller.signal,
          (received, total) => {
            setSingleTrackProgress(total > 0 ? received / total : 0);
          }
        );

        if (!response) {
          setSingleTrackLoading(null);
          setSingleTrackProgress(0);
          return false;
        }

        const clone = response.clone();
        await cache.put(url, clone);
        setCachedUrls((previous) => new Set([...previous, url]));
        setSingleTrackLoading(null);
        setSingleTrackProgress(0);
        return true;
      } catch {
        setSingleTrackLoading(null);
        setSingleTrackProgress(0);
        return false;
      }
    },
    [fetchWithProgress]
  );

  // ── Download all tracks ─────────────────────────────
  // Note: The Cache API shares the origin quota (often ~60% of free disk on
  // Chrome) and can be evicted under storage pressure. Use `estimateStorage`
  // to check available space before starting a bulk download.
  const downloadAllTracks = useCallback(
    async (playlist: Playlist) => {
      if (!('caches' in window)) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const total = playlist.length;
      let completed = 0;
      let failed = 0;
      let downloadedBytes = 0;

      setProgress({
        total,
        completed,
        failed,
        downloadedBytes,
        currentUrl: null,
        currentTrackProgress: 0,
      });

      const cache = await caches.open(OFFLINE_CACHE);

      for (const item of playlist) {
        if (controller.signal.aborted) break;
        try {
          const existing = await cache.match(item.link);
          if (existing) {
            // Already cached — count its actual size
            const blob = await existing.blob();
            downloadedBytes += blob.size;
            completed++;
            setProgress({
              total,
              completed,
              failed,
              downloadedBytes,
              currentUrl: null,
              currentTrackProgress: 0,
            });
            continue;
          }

          // Download with streaming progress
          setProgress({
            total,
            completed,
            failed,
            downloadedBytes,
            currentUrl: item.link,
            currentTrackProgress: 0,
          });

          const response = await fetchWithProgress(
            item.link,
            controller.signal,
            (received, contentTotal) => {
              setProgress({
                total,
                completed,
                failed,
                downloadedBytes,
                currentUrl: item.link,
                currentTrackProgress:
                  contentTotal > 0 ? received / contentTotal : 0,
              });
            }
          );

          if (response) {
            const clone = response.clone();
            const blob = await response.blob();
            downloadedBytes += blob.size;
            await cache.put(item.link, clone);
            setCachedUrls((previous) => new Set([...previous, item.link]));
            completed++;
          } else {
            failed++;
          }
        } catch {
          if (controller.signal.aborted) break;
          failed++;
        }
        setProgress({
          total,
          completed,
          failed,
          downloadedBytes,
          currentUrl: null,
          currentTrackProgress: 0,
        });
      }

      setProgress(null);
      await refreshCachedUrls();
    },
    [refreshCachedUrls, fetchWithProgress]
  );

  const cancelDownload = useCallback(() => {
    abortRef.current?.abort();
    setProgress(null);
  }, []);

  const cancelSingleDownload = useCallback(() => {
    singleAbortRef.current?.abort();
    setSingleTrackLoading(null);
    setSingleTrackProgress(0);
  }, []);

  const removeTrack = useCallback(async (url: string) => {
    if (!('caches' in window)) return;
    const cache = await caches.open(OFFLINE_CACHE);
    await cache.delete(url);
    setCachedUrls((previous) => {
      const next = new Set(previous);
      next.delete(url);
      return next;
    });
  }, []);

  const removeAllTracks = useCallback(
    async (playlist: Playlist) => {
      if (!('caches' in window)) return;
      const cache = await caches.open(OFFLINE_CACHE);
      await Promise.all(playlist.map((item) => cache.delete(item.link)));
      await refreshCachedUrls();
    },
    [refreshCachedUrls]
  );

  const isTrackCached = useCallback(
    (url: string) => cachedUrls.has(url),
    [cachedUrls]
  );

  const getCachedCount = useCallback(
    (playlist: Playlist) =>
      playlist.filter((item) => cachedUrls.has(item.link)).length,
    [cachedUrls]
  );

  const isAllCached = useCallback(
    (playlist: Playlist) =>
      playlist.length > 0 &&
      playlist.every((item) => cachedUrls.has(item.link)),
    [cachedUrls]
  );

  // ── Storage estimation ──────────────────────────────
  const estimateStorage =
    useCallback(async (): Promise<StorageEstimate | null> => {
      if (!navigator.storage?.estimate) return null;
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage ?? 0;
        const quota = estimate.quota ?? 0;
        return { usage, quota, available: quota - usage };
      } catch {
        return null;
      }
    }, []);

  /**
   * Check whether there is enough storage for a download.
   * `expectedBytes` is a rough estimate of the total download size.
   * Returns true if there's enough room, false if not, null if unknown.
   */
  const checkStorageAvailable = useCallback(
    async (expectedBytes: number): Promise<boolean | null> => {
      const estimate = await estimateStorage();
      if (!estimate) return null; // cannot determine
      return estimate.available > expectedBytes;
    },
    [estimateStorage]
  );

  // ── List cached mushafs with sizes (for cache management UI) ──
  const getCachedMoshafs = useCallback(
    async (
      reciters: Array<{
        name: string;
        moshaf: { name: string; server: string; playlist: Playlist };
      }>
    ): Promise<CachedMoshaf[]> => {
      if (!('caches' in window)) return [];
      try {
        const cache = await caches.open(OFFLINE_CACHE);
        const results: CachedMoshaf[] = [];

        for (const reciter of reciters) {
          const playlistLinks = reciter.moshaf.playlist.map(
            (item) => item.link
          );
          const cachedLinks: string[] = [];
          let totalBytes = 0;

          for (const link of playlistLinks) {
            if (!cachedUrls.has(link)) continue;
            cachedLinks.push(link);
            const match = await cache.match(link);
            if (match) {
              const blob = await match.blob();
              totalBytes += blob.size;
            }
          }

          if (cachedLinks.length > 0) {
            results.push({
              reciterName: reciter.name,
              moshafName: reciter.moshaf.name,
              trackCount: cachedLinks.length,
              totalBytes,
              links: cachedLinks,
            });
          }
        }

        return results;
      } catch {
        return [];
      }
    },
    [cachedUrls]
  );

  /** Delete all cached tracks for a given set of links */
  const removeCachedLinks = useCallback(
    async (links: string[]) => {
      if (!('caches' in window)) return;
      const cache = await caches.open(OFFLINE_CACHE);
      await Promise.all(links.map((link) => cache.delete(link)));
      await refreshCachedUrls();
    },
    [refreshCachedUrls]
  );

  return {
    cachedUrls,
    progress,
    singleTrackLoading,
    singleTrackProgress,
    downloadTrack,
    downloadAllTracks,
    cancelDownload,
    cancelSingleDownload,
    removeTrack,
    removeAllTracks,
    isTrackCached,
    getCachedCount,
    isAllCached,
    refreshCachedUrls,
    estimateStorage,
    checkStorageAvailable,
    getCachedMoshafs,
    removeCachedLinks,
  };
}
