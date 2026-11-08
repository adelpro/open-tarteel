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
            id="download.downloadAllSurahs"
            defaultMessage="Download all surahs"
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

  const Icon =
    status === 'saved'
      ? MdCloudDone
      : status === 'offline'
        ? MdCloudOff
        : status === 'error'
          ? MdWarning
          : MdCloudDownload;

  const iconTone =
    status === 'saved'
      ? 'text-success'
      : status === 'error'
        ? 'text-danger'
        : status === 'offline'
          ? 'text-ink-muted'
          : 'text-primary';

  const progressTone =
    status === 'saved'
      ? 'bg-success'
      : status === 'error'
        ? 'bg-danger'
        : status === 'offline'
          ? 'bg-ink-muted'
          : 'bg-primary';

  return (
    <div className="rounded-[10px] border border-border bg-surface p-2">
      <div className="flex items-center gap-2">
        <div aria-live="polite" className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon
              size={16}
              className={cn('shrink-0', iconTone)}
              aria-hidden="true"
            />
            <p className="truncate text-[13px] font-bold text-ink">{label}</p>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-ink-muted">
            {subtitle}
          </p>
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
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-danger transition-colors duration-120 hover:bg-surface-sunken"
              aria-label={formatMessage({
                id: 'download.cancel',
                defaultMessage: 'Cancel download',
              })}
            >
              <MdOutlineCancel size={18} />
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
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-danger transition-colors duration-120 hover:bg-surface-sunken"
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
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[12px] font-bold leading-none text-on-primary transition-colors duration-120 hover:bg-primary-hover disabled:opacity-50"
          >
            <MdCloudDownload
              size={15}
              className="shrink-0"
              aria-hidden="true"
            />
            <span className="leading-none">
              <FormattedMessage
                id="download.action"
                defaultMessage="Download"
              />
            </span>
          </button>
        ) : null}
      </div>

      {status !== 'idle' || cachedPercent > 0 ? (
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-300',
              progressTone
            )}
            style={{
              width: `${
                status === 'downloading' ? progressPercent : cachedPercent
              }%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
