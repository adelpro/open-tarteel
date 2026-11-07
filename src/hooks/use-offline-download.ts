'use client';

import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';

import { selectedReciterAtom } from '@/jotai/atom';
import { offlineStateAtom } from '@/jotai/offline';
import {
  deleteDownloads,
  getAllDownloads,
  putDownload,
  putDownloads,
} from '@/services/offline/database';
import type {
  CachedMoshaf,
  DownloadProgress,
  OfflineDownloadRecord,
  OfflineErrorCode,
  StorageEstimate,
} from '@/services/offline/types';
import type { Playlist } from '@/types';

export type {
  CachedMoshaf,
  DownloadProgress,
  StorageEstimate,
} from '@/services/offline/types';

const OFFLINE_CACHE = 'quran-offline-downloads';
const ESTIMATED_BYTES_PER_SURAH = 5 * 1024 * 1024;
/** Keep 20% of free space for the browser and metadata. */
const QUOTA_HEADROOM = 1.2;

let activeController: AbortController | null = null;
let singleController: AbortController | null = null;
let operationId = 0;
let hydratePromise: Promise<void> | null = null;
let persistPromise: Promise<boolean | null> | null = null;

class StorageQuotaError extends Error {
  name = 'StorageQuotaError';
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof StorageQuotaError) return true;
  if (error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }
  return error instanceof Error && /quota/i.test(error.message);
}

const canUseCache = (): boolean =>
  typeof window !== 'undefined' && 'caches' in window;

export function useOfflineDownload() {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const [state, setState] = useAtom(offlineStateAtom);
  const {
    cachedUrls,
    records,
    progress,
    singleTrackLoading,
    singleTrackProgress,
    lastError,
    storagePersisted,
    hydrated,
  } = state;

  const context = useMemo(() => {
    if (!selectedReciter) return null;
    return {
      reciterId: selectedReciter.id,
      moshafId: selectedReciter.moshaf.id,
      reciterName: selectedReciter.name,
      moshafName: selectedReciter.moshaf.name,
    };
  }, [selectedReciter]);

  const buildRecord = useCallback(
    (url: string, bytes: number): OfflineDownloadRecord => {
      const surahId = selectedReciter?.moshaf.playlist.find(
        (item) => item.link === url
      )?.surahId;
      return {
        url,
        bytes,
        downloadedAt: Date.now(),
        backend: 'cache',
        ...context,
        ...(surahId ? { surahId } : {}),
      };
    },
    [context, selectedReciter]
  );

  // ── Storage helpers ─────────────────────────────────
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

  const checkStorageAvailable = useCallback(
    async (expectedBytes: number): Promise<boolean | null> => {
      const estimate = await estimateStorage();
      if (!estimate) return null; // cannot determine
      return estimate.available > expectedBytes * QUOTA_HEADROOM;
    },
    [estimateStorage]
  );

  // ── Cache/metadata reconciliation ───────────────────
  const refreshCachedUrls = useCallback(async () => {
    if (!canUseCache()) {
      setState((previous) => ({ ...previous, hydrated: true }));
      return;
    }

    try {
      const cache = await caches.open(OFFLINE_CACHE);
      const keys = await cache.keys();
      const urls = new Set(keys.map((request) => request.url));
      const records = await getAllDownloads();
      const known = new Map(records.map((record) => [record.url, record]));

      const stale = records
        .filter((record) => !urls.has(record.url))
        .map((record) => record.url);
      if (stale.length > 0) await deleteDownloads(stale);

      const legacy: OfflineDownloadRecord[] = [...urls]
        .filter((url) => !known.has(url))
        .map((url) => ({
          url,
          bytes: 0,
          downloadedAt: Date.now(),
          backend: 'cache',
        }));
      if (legacy.length > 0) await putDownloads(legacy);

      const nextRecords = [
        ...records.filter((record) => urls.has(record.url)),
        ...legacy,
      ];

      setState((previous) => ({
        ...previous,
        cachedUrls: urls,
        records: nextRecords,
        hydrated: true,
      }));
    } catch {
      setState((previous) => ({ ...previous, hydrated: true }));
    }
  }, [setState]);

  const hydrate = useCallback(async () => {
    if (hydrated) return;
    if (hydratePromise) return hydratePromise;

    hydratePromise = (async () => {
      await refreshCachedUrls();

      if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
        persistPromise ??= navigator.storage.persist().catch(() => null);
        const persisted = await persistPromise;
        setState((previous) => ({
          ...previous,
          storagePersisted: persisted,
        }));
      }
    })().finally(() => {
      hydratePromise = null;
    });

    return hydratePromise;
  }, [hydrated, refreshCachedUrls, setState]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // ── Fetch with progress + quota guard ───────────────
  const fetchWithProgress = useCallback(
    async (
      url: string,
      signal: AbortSignal,
      onProgress?: (
        _received: number,
        _total: number,
        _speedBps: number
      ) => void,
      onContentLength?: (_bytes: number) => Promise<boolean>
    ): Promise<Response | null> => {
      const response = await fetch(url, { mode: 'cors', signal });
      if (!response.ok) return null;

      const contentLength = Number(response.headers.get('content-length')) || 0;
      if (contentLength > 0 && onContentLength) {
        const allowed = await onContentLength(contentLength);
        if (!allowed) {
          signal.throwIfAborted();
          throw new StorageQuotaError('Not enough storage');
        }
      }

      if (!response.body || !contentLength) {
        return response;
      }

      const reader = response.body.getReader();
      const chunks: ArrayBuffer[] = [];
      let received = 0;
      let lastTime = performance.now();
      let lastReceived = 0;
      let speed = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        // Copy into a fresh ArrayBuffer so Blob accepts the chunk under strict
        // DOM typings (avoids SharedArrayBuffer/ArrayBufferLike mismatch).
        const copy = new Uint8Array(value.byteLength);
        copy.set(value);
        chunks.push(copy.buffer);
        received += value.length;

        const now = performance.now();
        const elapsed = (now - lastTime) / 1000;
        if (elapsed >= 0.2) {
          const instant = (received - lastReceived) / elapsed;
          speed = speed === 0 ? instant : 0.4 * instant + 0.6 * speed;
          lastTime = now;
          lastReceived = received;
          onProgress?.(received, contentLength, speed);
        }
      }

      onProgress?.(received, contentLength, speed);

      return new Response(new Blob(chunks), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    },
    []
  );

  // ── Download a single track ─────────────────────────
  const downloadTrack = useCallback(
    async (url: string): Promise<boolean> => {
      if (!canUseCache()) return false;

      let controller: AbortController | null = null;
      let currentOperation = 0;
      try {
        const cache = await caches.open(OFFLINE_CACHE);
        if (await cache.match(url)) {
          setState((previous) => ({
            ...previous,
            cachedUrls: new Set([...previous.cachedUrls, url]),
          }));
          return true;
        }

        singleController?.abort();
        controller = new AbortController();
        singleController = controller;
        currentOperation = ++operationId;

        setState((previous) => ({
          ...previous,
          singleTrackLoading: url,
          singleTrackProgress: 0,
          lastError: null,
        }));

        const response = await fetchWithProgress(
          url,
          controller.signal,
          (received, total, speed) => {
            if (currentOperation !== operationId) return;
            setState((previous) => ({
              ...previous,
              singleTrackProgress: total > 0 ? received / total : 0,
              progress: previous.progress
                ? { ...previous.progress, speedBps: speed }
                : previous.progress,
            }));
          },
          async (bytes) => {
            const available = await checkStorageAvailable(bytes);
            return available !== false;
          }
        );

        if (!response) throw new Error('Download failed');

        const clone = response.clone();
        const blob = await response.blob();
        await cache.put(url, clone);
        const record = buildRecord(url, blob.size);
        await putDownload(record);

        setState((previous) => ({
          ...previous,
          cachedUrls: new Set([...previous.cachedUrls, url]),
          records: [
            ...previous.records.filter((item) => item.url !== url),
            record,
          ],
          singleTrackLoading: null,
          singleTrackProgress: 0,
        }));
        return true;
      } catch (error) {
        if (currentOperation !== operationId) return false;
        const code: OfflineErrorCode =
          controller?.signal.aborted || controllerAborted(error)
            ? null
            : isQuotaError(error)
              ? 'quota'
              : 'network';
        setState((previous) => ({
          ...previous,
          singleTrackLoading: null,
          singleTrackProgress: 0,
          lastError: code,
        }));
        return false;
      } finally {
        if (controller && singleController === controller) {
          singleController = null;
        }
      }
    },
    [buildRecord, checkStorageAvailable, fetchWithProgress, setState]
  );

  // ── Download all tracks ─────────────────────────────
  const downloadAllTracks = useCallback(
    async (playlist: Playlist) => {
      if (!canUseCache()) return;

      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      const currentOperation = ++operationId;

      const total = playlist.length;
      const uncached = playlist.filter((item) => !cachedUrls.has(item.link));
      const estimatedBytes = uncached.length * ESTIMATED_BYTES_PER_SURAH;

      const hasSpace = await checkStorageAvailable(estimatedBytes);
      if (hasSpace === false) {
        setState((previous) => ({
          ...previous,
          progress: null,
          lastError: 'quota',
        }));
        activeController = null;
        return;
      }

      let completed = 0;
      let failed = 0;
      let downloadedBytes = 0;

      const setProgress = (
        update: Partial<DownloadProgress> & {
          currentUrl: string | null;
          currentTrackProgress: number;
        }
      ) => {
        if (currentOperation !== operationId) return;
        setState((previous) => ({
          ...previous,
          progress: {
            total,
            completed,
            failed,
            downloadedBytes,
            ...update,
          },
        }));
      };

      setState((previous) => ({
        ...previous,
        lastError: null,
        progress: {
          total,
          completed,
          failed,
          downloadedBytes,
          currentUrl: null,
          currentTrackProgress: 0,
        },
      }));

      try {
        const cache = await caches.open(OFFLINE_CACHE);

        for (const item of playlist) {
          if (controller.signal.aborted) break;

          try {
            const existing = await cache.match(item.link);
            if (existing) {
              const blob = await existing.blob();
              downloadedBytes += blob.size;
              completed++;
              setProgress({
                currentUrl: null,
                currentTrackProgress: 0,
              });
              continue;
            }

            setProgress({
              currentUrl: item.link,
              currentTrackProgress: 0,
              speedBps: 0,
              etaSeconds: undefined,
            });

            const response = await fetchWithProgress(
              item.link,
              controller.signal,
              (received, contentTotal, speed) => {
                setProgress({
                  currentUrl: item.link,
                  currentTrackProgress:
                    contentTotal > 0 ? received / contentTotal : 0,
                  speedBps: speed,
                  etaSeconds:
                    speed > 0 && contentTotal > 0
                      ? (contentTotal - received) / speed
                      : undefined,
                });
              },
              async (bytes) => {
                const available = await checkStorageAvailable(bytes);
                return available !== false;
              }
            );

            if (!response) {
              failed++;
            } else {
              const clone = response.clone();
              const blob = await response.blob();
              await cache.put(item.link, clone);
              const record = buildRecord(item.link, blob.size);
              await putDownload(record);
              downloadedBytes += blob.size;
              completed++;
              setState((previous) => ({
                ...previous,
                cachedUrls: new Set([...previous.cachedUrls, item.link]),
                records: [
                  ...previous.records.filter(
                    (entry) => entry.url !== item.link
                  ),
                  record,
                ],
              }));
            }
          } catch (error) {
            if (controller.signal.aborted) break;
            failed++;
            if (isQuotaError(error)) {
              setState((previous) => ({ ...previous, lastError: 'quota' }));
              break;
            }
          }

          setProgress({
            currentUrl: null,
            currentTrackProgress: 0,
            speedBps: 0,
            etaSeconds: undefined,
          });
        }
      } finally {
        if (currentOperation === operationId) {
          setState((previous) => ({ ...previous, progress: null }));
        }
        if (activeController === controller) activeController = null;
        await refreshCachedUrls();
      }
    },
    [
      buildRecord,
      cachedUrls,
      checkStorageAvailable,
      fetchWithProgress,
      refreshCachedUrls,
      setState,
    ]
  );

  const cancelDownload = useCallback(() => {
    activeController?.abort();
    activeController = null;
    operationId += 1;
    setState((previous) => ({ ...previous, progress: null }));
  }, [setState]);

  const cancelSingleDownload = useCallback(() => {
    singleController?.abort();
    singleController = null;
    operationId += 1;
    setState((previous) => ({
      ...previous,
      singleTrackLoading: null,
      singleTrackProgress: 0,
    }));
  }, [setState]);

  const removeTrack = useCallback(
    async (url: string) => {
      if (!canUseCache()) return;
      const cache = await caches.open(OFFLINE_CACHE);
      await cache.delete(url);
      await deleteDownloads([url]);
      setState((previous) => {
        const next = new Set(previous.cachedUrls);
        next.delete(url);
        return {
          ...previous,
          cachedUrls: next,
          records: previous.records.filter((record) => record.url !== url),
        };
      });
    },
    [setState]
  );

  const removeAllTracks = useCallback(
    async (playlist: Playlist) => {
      if (!canUseCache()) return;
      const cache = await caches.open(OFFLINE_CACHE);
      await Promise.all(playlist.map((item) => cache.delete(item.link)));
      await deleteDownloads(playlist.map((item) => item.link));
      await refreshCachedUrls();
    },
    [refreshCachedUrls]
  );

  const isTrackCached = useCallback(
    (url: string) => cachedUrls.has(url),
    [cachedUrls]
  );

  const isReciterDownloaded = useCallback(
    (reciterId: string, moshafId: string) =>
      records.some(
        (record) =>
          record.reciterId === reciterId && record.moshafId === moshafId
      ),
    [records]
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

  // ── List cached mushafs with sizes (for cache management UI) ──
  const getCachedMoshafs = useCallback(async (): Promise<CachedMoshaf[]> => {
    if (!canUseCache()) return [];
    try {
      const cache = await caches.open(OFFLINE_CACHE);
      const sourceRecords: OfflineDownloadRecord[] =
        records.length > 0
          ? records
          : [...cachedUrls].map((url) => ({
              url,
              bytes: 0,
              downloadedAt: 0,
              backend: 'cache' as const,
            }));

      const groups = new Map<
        string,
        {
          reciterName: string;
          moshafName: string;
          links: string[];
          totalBytes: number;
        }
      >();

      for (const record of sourceRecords) {
        const key = `${record.reciterId ?? 'unknown'}:${record.moshafId ?? 'unknown'}`;
        const group = groups.get(key) ?? {
          reciterName: record.reciterName ?? 'Unknown reciter',
          moshafName: record.moshafName ?? 'Audio',
          links: [],
          totalBytes: 0,
        };

        group.links.push(record.url);
        if (record.bytes > 0) {
          group.totalBytes += record.bytes;
        } else {
          const match = await cache.match(record.url);
          if (match) {
            const blob = await match.blob();
            group.totalBytes += blob.size;
          }
        }
        groups.set(key, group);
      }

      return [...groups.values()]
        .filter((group) => group.links.length > 0)
        .map((group) => ({
          reciterName: group.reciterName,
          moshafName: group.moshafName,
          trackCount: group.links.length,
          totalBytes: group.totalBytes,
          links: group.links,
        }));
    } catch {
      return [];
    }
  }, [cachedUrls, records]);

  /** Delete all cached tracks for a given set of links */
  const removeCachedLinks = useCallback(
    async (links: string[]) => {
      if (!canUseCache()) return;
      const cache = await caches.open(OFFLINE_CACHE);
      await Promise.all(links.map((link) => cache.delete(link)));
      await deleteDownloads(links);
      await refreshCachedUrls();
    },
    [refreshCachedUrls]
  );

  return {
    cachedUrls,
    records,
    progress,
    singleTrackLoading,
    singleTrackProgress,
    lastError,
    storagePersisted,
    hydrate,
    downloadTrack,
    downloadAllTracks,
    cancelDownload,
    cancelSingleDownload,
    removeTrack,
    removeAllTracks,
    isTrackCached,
    isReciterDownloaded,
    getCachedCount,
    isAllCached,
    refreshCachedUrls,
    estimateStorage,
    checkStorageAvailable,
    getCachedMoshafs,
    removeCachedLinks,
  };
}

function controllerAborted(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
