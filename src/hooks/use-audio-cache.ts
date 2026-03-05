'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  CacheEntry,
  CacheStats,
} from '@/utils/audio-cache';
import {
  cacheAudioFile,
  clearAllCache,
  getAllCachedEntries,
  getCacheStats,
  isCached,
  removeCachedAudio,
  removeCachedReciter,
  removeCachedSurah,
} from '@/utils/audio-cache';

type CacheOperation = 'idle' | 'caching' | 'removing';

export function useAudioCache() {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalSize: 0,
    entriesCount: 0,
    availableSpace: 0,
  });
  const [cachedEntries, setCachedEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState<CacheOperation>('idle');

  /**
   * Refresh cache statistics and entries
   */
  const refreshCache = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, entries] = await Promise.all([
        getCacheStats(),
        getAllCachedEntries(),
      ]);
      setCacheStats(stats);
      setCachedEntries(entries);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to refresh cache information'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    refreshCache();
  }, [refreshCache]);

  /**
   * Check if a specific URL is cached
   */
  const checkIfCached = useCallback(
    async (url: string): Promise<boolean> => {
      return isCached(url);
    },
    []
  );

  /**
   * Cache a single audio file
   */
  const cacheAudio = useCallback(
    async (
      url: string,
      metadata: Omit<CacheEntry, 'url' | 'cachedAt' | 'fileSize'>,
      onProgress?: (progress: number) => void
    ): Promise<void> => {
      try {
        setOperation('caching');
        setError(null);
        await cacheAudioFile(url, metadata);
        await refreshCache();
        onProgress?.(100);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to cache audio';
        setError(message);
        throw err;
      } finally {
        setOperation('idle');
      }
    },
    [refreshCache]
  );

  /**
   * Cache multiple audio files for a surah
   */
  const cacheSurah = useCallback(
    async (
      playlist: Array<{ link: string }>,
      surahId: string,
      surahName: string,
      reciterId: number,
      reciterName: string,
      onProgress?: (current: number, total: number) => void
    ): Promise<void> => {
      try {
        setOperation('caching');
        setError(null);

        for (let index = 0; index < playlist.length; index++) {
          const item = playlist[index];
          // Only cache if not already cached
          const alreadyCached = await isCached(item.link);
          if (!alreadyCached) {
            await cacheAudioFile(item.link, {
              surahId,
              surahName,
              reciterId,
              reciterName,
            });
          }
          onProgress?.(index + 1, playlist.length);
        }

        await refreshCache();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to cache surah';
        setError(message);
        throw err;
      } finally {
        setOperation('idle');
      }
    },
    [refreshCache]
  );

  /**
   * Remove a cached audio file
   */
  const removeCached = useCallback(
    async (url: string): Promise<void> => {
      try {
        setOperation('removing');
        setError(null);
        await removeCachedAudio(url);
        await refreshCache();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to remove cached audio';
        setError(message);
        throw err;
      } finally {
        setOperation('idle');
      }
    },
    [refreshCache]
  );

  /**
   * Remove all cached files for a surah
   */
  const removeSurahCache = useCallback(
    async (surahId: string): Promise<void> => {
      try {
        setOperation('removing');
        setError(null);
        await removeCachedSurah(surahId);
        await refreshCache();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to remove surah cache';
        setError(message);
        throw err;
      } finally {
        setOperation('idle');
      }
    },
    [refreshCache]
  );

  /**
   * Remove all cached files for a reciter
   */
  const removeReciterCache = useCallback(
    async (reciterId: number): Promise<void> => {
      try {
        setOperation('removing');
        setError(null);
        await removeCachedReciter(reciterId);
        await refreshCache();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to remove reciter cache';
        setError(message);
        throw err;
      } finally {
        setOperation('idle');
      }
    },
    [refreshCache]
  );

  /**
   * Clear all cached audio
   */
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      setOperation('removing');
      setError(null);
      await clearAllCache();
      await refreshCache();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to clear cache';
      setError(message);
      throw err;
    } finally {
      setOperation('idle');
    }
  }, [refreshCache]);

  return {
    // State
    cacheStats,
    cachedEntries,
    loading,
    error,
    operation,

    // Methods
    refreshCache,
    checkIfCached,
    cacheAudio,
    cacheSurah,
    removeCached,
    removeSurahCache,
    removeReciterCache,
    clearCache,
  };
}
