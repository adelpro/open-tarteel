'use client';

import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { useAudioCache } from '@/hooks/use-audio-cache';
import type { PlaylistItem } from '@/types';
import { cn } from '@/utils';

type CacheSurahButtonProps = {
  surahId: string;
  surahName: string;
  playlist: PlaylistItem[];
  reciterId: number;
  reciterName: string;
  compact?: boolean;
};

export default function CacheSurahButton({
  surahId,
  surahName,
  playlist,
  reciterId,
  reciterName,
  compact = false,
}: CacheSurahButtonProps) {
  const intl = useIntl();
  const isARLocale = intl.locale === 'ar';

  const {
    cacheAudio,
    checkIfCached,
    cacheSurah,
    operation,
    cachedEntries,
    removeSurahCache,
  } = useAudioCache();

  const [isCached, setIsCached] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [progress, setProgress] = useState(0);

  // Check if surah is cached on mount
  useEffect(() => {
    const checkCache = async () => {
      setIsChecking(true);
      try {
        // Count how many in this playlist are cached
        const cachedCount = cachedEntries.filter(
          (entry) => entry.surahId === surahId
        ).length;
        setIsCached(cachedCount > 0);
        setProgress(cachedCount);
      } finally {
        setIsChecking(false);
      }
    };

    checkCache();
  }, [surahId, cachedEntries]);

  const handleCache = async () => {
    if (isCached) {
      // Option to clear cache
      if (
        !confirm(
          isARLocale
            ? 'هل تريد حذف هذه السورة من التخزين المؤقت؟'
            : 'Remove this surah from cache?'
        )
      ) {
        return;
      }
      try {
        await removeSurahCache(surahId);
        setIsCached(false);
        setProgress(0);
      } catch (error) {
        console.error('Failed to remove surah from cache:', error);
      }
      return;
    }

    try {
      setProgress(0);
      console.log(`[Cache] Starting to cache surah ${surahId}...`);

      // Find the URL for this surah from the playlist
      const audioUrl = playlist.find((item) => item.surahId === surahId)?.link;

      if (!audioUrl) {
        throw new Error('Audio URL not found for this surah');
      }

      // Cache just this one surah
      await cacheAudio(
        audioUrl,
        {
          surahId,
          surahName,
          reciterId,
          reciterName,
        },
        (progress) => {
          console.log(`[Cache] Progress: ${progress.toFixed(0)}%`);
          setProgress(progress);
        }
      );

      console.log(`[Cache] Successfully cached surah ${surahId}`);
      setIsCached(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Cache] Error caching surah ${surahId}:`, errorMessage);
      alert(isARLocale ? `خطأ: ${errorMessage}` : `Error: ${errorMessage}`);
    }
  };

  const isLoading = operation === 'caching' || isChecking;
  const isDisabled = isLoading;

  if (compact) {
    return (
      <button
        onClick={handleCache}
        disabled={isDisabled}
        title={
          isCached
            ? isARLocale
              ? 'تم تخزينها مؤقتاً'
              : 'Cached'
            : isARLocale
              ? 'تخزين مؤقت'
              : 'Cache'
        }
        className={cn(
          'rounded-full p-2 transition-colors',
          isCached
            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
          isDisabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isCached ? (
          '✓'
        ) : (
          '💾'
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCache}
        disabled={isDisabled}
        className={cn(
          'flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
          isCached
            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800',
          isDisabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {isLoading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {isARLocale ? 'جاري التخزين...' : 'Caching...'}
          </>
        ) : isCached ? (
          <>
            <span>✓</span>
            {isARLocale ? 'مخزنة مؤقتاً' : 'Cached'}
          </>
        ) : (
          <>
            <span>💾</span>
            {isARLocale ? 'تخزين مؤقت' : 'Cache Surah'}
          </>
        )}
      </button>

      {/* Progress bar */}
      {isLoading && progress > 0 && (
        <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isCached ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
