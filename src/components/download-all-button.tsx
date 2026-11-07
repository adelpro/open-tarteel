'use client';

import React, { useCallback, useState } from 'react';
import {
  MdCloudDone,
  MdCloudDownload,
  MdCloudOff,
  MdDeleteOutline,
  MdOutlineCancel,
  MdWarning,
} from 'react-icons/md';
import { FormattedMessage, useIntl } from 'react-intl';

import Tooltip from '@/components/tooltip';
import { SURAHS } from '@/constants';
import type { DownloadProgress } from '@/hooks/use-offline-download';
import type { OfflineErrorCode } from '@/services/offline/types';
import type { Playlist } from '@/types';
import { cn, formatBytes, getSurahDisplayName } from '@/utils';

/** Rough average MP3 size per surah (~5 MB) for pre-download estimate */
const ESTIMATED_BYTES_PER_SURAH = 5 * 1024 * 1024;

type Props = {
  playlist: Playlist;
  cachedCount: number;
  isAllCached: boolean;
  isOnline: boolean;
  progress: DownloadProgress | null;
  onDownloadAll: (playlist: Playlist) => void;
  onRemoveAll: (playlist: Playlist) => void;
  onCancel: () => void;
  error?: OfflineErrorCode;
  checkStorageAvailable?: (expectedBytes: number) => Promise<boolean | null>;
  estimateStorage?: () => Promise<{
    usage: number;
    quota: number;
    available: number;
  } | null>;
};

type Status = 'downloading' | 'saved' | 'offline' | 'error' | 'idle';

function getStatus(
  isDownloading: boolean,
  isAllCached: boolean,
  isOnline: boolean,
  error?: OfflineErrorCode
): Status {
  if (isDownloading) return 'downloading';
  if (isAllCached) return 'saved';
  if (!isOnline) return 'offline';
  return error ? 'error' : 'idle';
}

export default function DownloadAllButton({
  playlist,
  cachedCount,
  isAllCached,
  isOnline,
  progress,
  onDownloadAll,
  onRemoveAll,
  onCancel,
  error,
  checkStorageAvailable,
  estimateStorage,
}: Props) {
  const { formatMessage, locale } = useIntl();
  const isDownloading = progress !== null;
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const handleDownloadAll = useCallback(async () => {
    setStorageWarning(null);
    const uncachedCount = playlist.length - cachedCount;
    const estimatedBytes = uncachedCount * ESTIMATED_BYTES_PER_SURAH;

    if (checkStorageAvailable) {
      const hasSpace = await checkStorageAvailable(estimatedBytes);
      if (hasSpace === false && estimateStorage) {
        const estimate = await estimateStorage();
        setStorageWarning(
          formatMessage(
            {
              id: 'storage.insufficientSpace',
              defaultMessage:
                'Not enough storage space. Available: {available}, estimated need: {needed}. Free up space or remove other downloads.',
            },
            {
              available: estimate ? formatBytes(estimate.available) : '?',
              needed: formatBytes(estimatedBytes),
            }
          )
        );
        return;
      }
    }

    onDownloadAll(playlist);
  }, [
    playlist,
    cachedCount,
    checkStorageAvailable,
    estimateStorage,
    onDownloadAll,
    formatMessage,
  ]);

  const status = getStatus(isDownloading, isAllCached, isOnline, error);
  const cachedPercent =
    playlist.length > 0 ? Math.round((cachedCount / playlist.length) * 100) : 0;
  const progressPercent = progress
    ? Math.round((progress.completed / progress.total) * 100)
    : cachedPercent;
  const trackPercent = progress
    ? Math.round(progress.currentTrackProgress * 100)
    : 0;

  const currentSurahName = (() => {
    if (!progress?.currentUrl) return null;
    const currentItem = playlist.find(
      (item) => item.link === progress.currentUrl
    );
    if (!currentItem) return null;
    const surah = SURAHS.find((s) => s.id.toString() === currentItem.surahId);
    return surah ? getSurahDisplayName(surah, locale) : null;
  })();

  const errorMessage =
    status === 'error'
      ? error === 'quota'
        ? formatMessage({
            id: 'download.errorQuota',
            defaultMessage:
              'Not enough storage. Free up space or remove downloads, then try again.',
          })
        : error === 'network'
          ? formatMessage({
              id: 'download.errorNetwork',
              defaultMessage:
                'Download failed. Check your connection and try again.',
            })
          : formatMessage({
              id: 'download.errorUnknown',
              defaultMessage: 'Download failed. Try again.',
            })
      : null;

  const label = (() => {
    switch (status) {
      case 'downloading':
        return (
          <FormattedMessage
            id="download.downloading"
            defaultMessage="Downloading… {completed}/{total}"
            values={{
              completed: progress?.completed ?? cachedCount,
              total: progress?.total ?? playlist.length,
            }}
          />
        );
      case 'saved':
        return (
          <FormattedMessage
            id="download.allSaved"
            defaultMessage="All surahs saved offline"
          />
        );
      case 'offline':
        return (
          <FormattedMessage
            id="download.offlineUnavailable"
            defaultMessage="Offline — downloads unavailable"
          />
        );
      case 'error':
        return errorMessage;
      default:
        return (
          <FormattedMessage
            id="download.downloadAll"
            defaultMessage="Download all surahs for offline ({cached}/{total})"
            values={{ cached: cachedCount, total: playlist.length }}
          />
        );
    }
  })();

  const subtitle = (() => {
    if (status === 'downloading') {
      return currentSurahName ?? '\u00A0';
    }
    if (storageWarning) return storageWarning;
    return (
      <FormattedMessage
        id="download.savedCount"
        defaultMessage="{cached} of {total} surahs saved"
        values={{ cached: cachedCount, total: playlist.length }}
      />
    );
  })();

  const percent = status === 'downloading' ? trackPercent : progressPercent;

  const Icon =
    status === 'saved'
      ? MdCloudDone
      : status === 'offline'
        ? MdCloudOff
        : status === 'error'
          ? MdWarning
          : MdCloudDownload;

  return (
    <div
      className={cn(
        'flex min-h-[76px] flex-col justify-center rounded-lg border px-3 py-2 transition-colors',
        status === 'saved' &&
          'border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-950/40',
        status === 'downloading' &&
          'border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40',
        status === 'error' &&
          'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40',
        status === 'offline' &&
          'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60',
        status === 'idle' &&
          'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          aria-live="polite"
          className={cn(
            'flex min-w-0 items-center gap-2 text-sm font-medium',
            status === 'saved' && 'text-green-700 dark:text-green-300',
            status === 'downloading' && 'text-blue-700 dark:text-blue-300',
            status === 'error' && 'text-red-700 dark:text-red-300',
            status === 'offline' && 'text-gray-600 dark:text-gray-300',
            status === 'idle' && 'text-blue-700 dark:text-blue-300'
          )}
        >
          <Icon size={20} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </div>

        {status === 'downloading' ? (
          <Tooltip
            content={formatMessage({
              id: 'download.cancel',
              defaultMessage: 'Cancel download',
            })}
          >
            <button
              onClick={onCancel}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 active:bg-red-200 dark:hover:bg-red-900/30"
              aria-label={formatMessage({
                id: 'download.cancel',
                defaultMessage: 'Cancel download',
              })}
            >
              <MdOutlineCancel size={20} />
            </button>
          </Tooltip>
        ) : status === 'saved' ? (
          <Tooltip
            content={formatMessage({
              id: 'download.removeAll',
              defaultMessage: 'Remove all downloads',
            })}
          >
            <button
              onClick={() => onRemoveAll(playlist)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
              aria-label={formatMessage({
                id: 'download.removeAll',
                defaultMessage: 'Remove all downloads',
              })}
            >
              <MdDeleteOutline size={18} />
            </button>
          </Tooltip>
        ) : status === 'idle' || status === 'error' ? (
          <button
            onClick={handleDownloadAll}
            className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-blue-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            <MdCloudDownload size={16} aria-hidden="true" />
            <FormattedMessage id="download.action" defaultMessage="Download" />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          'mt-1.5 h-1.5 w-full overflow-hidden rounded-full',
          status === 'saved' && 'bg-green-200 dark:bg-green-800',
          status === 'downloading' && 'bg-blue-200 dark:bg-blue-800',
          status === 'error' && 'bg-red-200 dark:bg-red-900',
          status === 'offline' && 'bg-gray-200 dark:bg-gray-700',
          status === 'idle' && 'bg-blue-200 dark:bg-blue-800'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            status === 'saved' && 'bg-green-500',
            status === 'downloading' && 'bg-blue-500',
            status === 'error' && 'bg-red-400',
            status === 'offline' && 'bg-gray-400',
            status === 'idle' && 'bg-blue-500'
          )}
          style={{
            width: `${status === 'downloading' ? progressPercent : cachedPercent}%`,
          }}
        />
      </div>

      <div
        className={cn(
          'mt-1 flex h-3.5 items-center justify-between gap-2 text-[10px]',
          status === 'saved' && 'text-green-600 dark:text-green-400',
          status === 'downloading' && 'text-blue-600 dark:text-blue-400',
          status === 'error' && 'text-red-600 dark:text-red-400',
          status === 'offline' && 'text-gray-500 dark:text-gray-400',
          status === 'idle' && 'text-blue-500 dark:text-blue-400'
        )}
      >
        <span
          className="truncate"
          title={typeof subtitle === 'string' ? subtitle : undefined}
        >
          {subtitle}
        </span>
        <span className="shrink-0">{percent}%</span>
      </div>
    </div>
  );
}
