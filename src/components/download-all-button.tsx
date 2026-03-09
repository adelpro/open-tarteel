'use client';

import React from 'react';
import {
  MdCloudDownload,
  MdCloudDone,
  MdDeleteOutline,
  MdClose,
} from 'react-icons/md';
import { FormattedMessage, useIntl } from 'react-intl';

import Tooltip from '@/components/tooltip';
import { SURAHS } from '@/constants';
import type { DownloadProgress } from '@/hooks/use-offline-download';
import type { Playlist } from '@/types';
import { cn, formatBytes } from '@/utils';
import { removeTashkeel } from '@/utils';

type Props = {
  playlist: Playlist;
  cachedCount: number;
  isAllCached: boolean;
  progress: DownloadProgress | null;
  onDownloadAll: (playlist: Playlist) => void;
  onRemoveAll: (playlist: Playlist) => void;
  onCancel: () => void;
};

export default function DownloadAllButton({
  playlist,
  cachedCount,
  isAllCached,
  progress,
  onDownloadAll,
  onRemoveAll,
  onCancel,
}: Props) {
  const { formatMessage, locale } = useIntl();
  const isDownloading = progress !== null;

  if (isDownloading) {
    const percent = Math.round((progress.completed / progress.total) * 100);
    const trackPercent = Math.round(progress.currentTrackProgress * 100);

    // Find current surah name from currentUrl
    const currentSurahName = (() => {
      if (!progress.currentUrl) return null;
      const currentItem = playlist.find((p) => p.link === progress.currentUrl);
      if (!currentItem) return null;
      const surah = SURAHS.find(
        (s) => s.id.toString() === currentItem.surahId
      );
      if (!surah) return null;
      return locale === 'en'
        ? surah.englishName
        : removeTashkeel(surah.name);
    })();

    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-blue-700 dark:text-blue-300">
              <FormattedMessage
                id="download.downloading"
                defaultMessage="Downloading… {completed}/{total}"
                values={{
                  completed: progress.completed,
                  total: progress.total,
                }}
              />
              {progress.downloadedBytes > 0 && (
                <span className="ms-1 text-[10px] font-normal text-blue-500 dark:text-blue-400">
                  ({formatBytes(progress.downloadedBytes)})
                </span>
              )}
            </span>
            <span className="text-blue-500 dark:text-blue-400">{percent}%</span>
          </div>
          {/* Overall progress */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          {/* Current surah progress */}
          {currentSurahName && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400">
                <span className="truncate">{currentSurahName}</span>
                <span>{trackPercent}%</span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all duration-200"
                  style={{ width: `${trackPercent}%` }}
                />
              </div>
            </div>
          )}
          {progress.failed > 0 && (
            <span className="mt-1 text-[10px] text-red-500">
              <FormattedMessage
                id="download.failed"
                defaultMessage="{count} failed"
                values={{ count: progress.failed }}
              />
            </span>
          )}
        </div>
        <Tooltip
          content={formatMessage({
            id: 'download.cancel',
            defaultMessage: 'Cancel download',
          })}
        >
          <button
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
            aria-label={formatMessage({
              id: 'download.cancel',
              defaultMessage: 'Cancel download',
            })}
          >
            <MdClose size={18} />
          </button>
        </Tooltip>
      </div>
    );
  }

  if (isAllCached) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-3 py-2 dark:border-green-900 dark:bg-green-950/40">
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
          <MdCloudDone size={20} />
          <FormattedMessage
            id="download.allSaved"
            defaultMessage="All surahs saved offline"
          />
        </div>
        <Tooltip
          content={formatMessage({
            id: 'download.removeAll',
            defaultMessage: 'Remove all downloads',
          })}
        >
          <button
            onClick={() => onRemoveAll(playlist)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
            aria-label={formatMessage({
              id: 'download.removeAll',
              defaultMessage: 'Remove all downloads',
            })}
          >
            <MdDeleteOutline size={18} />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <button
      onClick={() => onDownloadAll(playlist)}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
        'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
        'dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50'
      )}
    >
      <MdCloudDownload size={20} />
      <FormattedMessage
        id="download.downloadAll"
        defaultMessage="Download all surahs for offline ({cached}/{total})"
        values={{ cached: cachedCount, total: playlist.length }}
      />
    </button>
  );
}
