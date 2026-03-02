'use client';

import { useCallback, useEffect, useState } from 'react';

import { SW_EVENTS } from '@/constants';
import { formatBytes, getSW, openChannel } from '@/helpers';

export interface StorageStats {
  core: StorageCategory;
  tracks: StorageCategory;
  total: number;
  loading: boolean;
  error: string | null;
}

export interface StorageCategory {
  bytes: number;
  displaySize: string;
  cacheNames?: string[];
}

// ── Ask SW for total audio IDB bytes ─────────────────────────────────────────
async function getTrackBytes(): Promise<{ bytes: number; count: number }> {
  try {
    const sw = await getSW();
    if (!sw) return { bytes: 0, count: 0 };

    return await new Promise((resolve, reject) => {
      const { port, cleanup } = openChannel(sw, {
        type: SW_EVENTS.GET_STORAGE_STATS,
      });
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('timeout'));
      }, 3000);
      port.addEventListener('message', (e: MessageEvent) => {
        clearTimeout(timer);
        cleanup();
        resolve({
          bytes: e.data.totalBytes ?? 0,
          count: e.data.trackCount ?? 0,
        });
      });
      port.start();
    });
  } catch {
    return { bytes: 0, count: 0 };
  }
}

// ── All Cache Storage names (for listing what's cached) ──────────────────────
async function getCacheNames(): Promise<string[]> {
  try {
    return typeof caches !== 'undefined' ? await caches.keys() : [];
  } catch {
    return [];
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats>({
    core: { bytes: 0, displaySize: '0 B' },
    tracks: { bytes: 0, displaySize: '0 B' },
    total: 0,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setStats((s) => ({ ...s, loading: true, error: null }));
    try {
      // FIX: Use StorageManager.estimate() for total — reliable across all browsers.
      // This includes: Cache Storage (JS/CSS/RSC/HTML) + IDB (audio bytes).
      let totalEstimate = 0;
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const est = await navigator.storage.estimate();
        totalEstimate = est.usage ?? 0;
      }

      // Get audio IDB bytes from SW
      const { bytes: trackBytes } = await getTrackBytes();

      // Core = everything that isn't audio bytes
      const coreBytes = Math.max(0, totalEstimate - trackBytes);

      // Get cache names for the UI listing
      const cacheNames = await getCacheNames();

      setStats({
        core: {
          bytes: coreBytes,
          displaySize: formatBytes(coreBytes),
          cacheNames,
        },
        tracks: { bytes: trackBytes, displaySize: formatBytes(trackBytes) },
        total: totalEstimate,
        loading: false,
        error: null,
      });
    } catch (err) {
      setStats((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to read storage',
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Clear core (all Cache Storage caches) ────────────────────────────────
  const clearCore = useCallback(async () => {
    try {
      if (typeof caches === 'undefined') return;
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await load();
    } catch (err) {
      console.error('[clearCore]', err);
    }
  }, [load]);

  // ── Clear tracks (audio IDB via SW) ──────────────────────────────────────
  const clearTracks = useCallback(async () => {
    try {
      const sw = await getSW();
      if (sw) {
        await new Promise<void>((resolve, reject) => {
          const { port, cleanup } = openChannel(sw, {
            type: SW_EVENTS.CLEAR_ALL_TRACKS,
          });
          const timer = setTimeout(() => {
            cleanup();
            reject(new Error('timeout'));
          }, 5000);
          port.addEventListener('message', () => {
            clearTimeout(timer);
            cleanup();
            resolve();
          });
          port.start();
        });
      }
      await load();
    } catch (err) {
      console.error('[clearTracks]', err);
    }
  }, [load]);

  return { ...stats, reload: load, clearCore, clearTracks };
}
