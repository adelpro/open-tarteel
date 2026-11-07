'use client';

import { useAtomValue } from 'jotai';
import React from 'react';
import {
  MdCloudDone,
  MdCloudDownload,
  MdCloudOff,
  MdOutlineCancel,
  MdWarning,
} from 'react-icons/md';
import { FormattedMessage, useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import { selectedReciterAtom } from '@/jotai/atom';
import { canDownload } from '@/services/reciters/capabilities';
import { cn, formatTime, getSurahDisplayName } from '@/utils';

type Props = {
  currentTrackId: number;
  duration: number;
  currentTime: number;
};

type Status =
  'unavailable' | 'downloading' | 'saved' | 'offline' | 'error' | 'idle';

export default function TrackInfo({
  currentTrackId,
  duration,
  currentTime,
}: Props) {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const language = useIntl().locale;
  const { formatMessage } = useIntl();
  const isOnline = useNetworkStatus();
  const {
    progress,
    lastError,
    downloadAllTracks,
    cancelDownload,
    isAllCached,
    getCachedCount,
  } = useOfflineDownload();
  const playlist = selectedReciter?.moshaf.playlist;
  if (!Array.isArray(playlist)) return null;

  if (currentTrackId < 0 || currentTrackId >= playlist.length) return null;

  const currentTrack = playlist[currentTrackId];

  if (!currentTrack) return null;

  const { surahId } = currentTrack;
  const surahName = () => {
    const surah = SURAHS.find((s) => s.id.toString() === surahId);
    return surah ? getSurahDisplayName(surah, language) : '';
  };

  const downloadsEnabled = canDownload(selectedReciter?.source);
  const allCached = isAllCached(playlist);
  const cachedCount = getCachedCount(playlist);
  const cachedPercent =
    playlist.length > 0 ? Math.round((cachedCount / playlist.length) * 100) : 0;
  const trackPercent = progress
    ? Math.round(progress.currentTrackProgress * 100)
    : 0;

  const status: Status = !downloadsEnabled
    ? 'unavailable'
    : progress
      ? 'downloading'
      : allCached
        ? 'saved'
        : !isOnline
          ? 'offline'
          : lastError
            ? 'error'
            : 'idle';

  const errorMessage =
    status === 'error'
      ? lastError === 'quota'
        ? formatMessage({
            id: 'download.errorQuota',
            defaultMessage:
              'Not enough storage. Free up space or remove downloads, then try again.',
          })
        : lastError === 'network'
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
      case 'unavailable':
        return (
          <FormattedMessage
            id="download.streamingOnly"
            defaultMessage="Streaming only — download unavailable"
          />
        );
      case 'downloading':
        return (
          <FormattedMessage
            id="download.downloading"
            defaultMessage="Downloading… {completed}/{total}"
            values={{
              completed: progress?.completed ?? 0,
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

  const percent = status === 'downloading' ? trackPercent : cachedPercent;

  const Icon =
    status === 'saved'
      ? MdCloudDone
      : status === 'offline' || status === 'unavailable'
        ? MdCloudOff
        : status === 'error'
          ? MdWarning
          : MdCloudDownload;

  return (
    <div className="mt-3 flex flex-col items-center justify-center gap-1">
      <div className="flex items-center gap-2 font-bold text-gray-500">
        <span>{`${surahId} - ${surahName()}`}</span>
        <span>{`(${formatTime(currentTime)} ${duration > 0 ? formatTime(duration) : '--:--'})`}</span>
      </div>

      {/* Fixed-height download status area to prevent player card height changes */}
      <div className="min-h-[72px] w-full max-w-xs">
        <div
          className={cn(
            'flex min-h-[72px] flex-col justify-center rounded-lg border px-3 py-1.5 transition-colors',
            status === 'saved' &&
              'border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-950/40',
            status === 'downloading' &&
              'border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40',
            status === 'error' &&
              'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40',
            (status === 'offline' || status === 'unavailable') &&
              'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60',
            status === 'idle' &&
              'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div
              aria-live="polite"
              className={cn(
                'flex min-w-0 items-center gap-1.5 text-xs font-medium',
                status === 'saved' && 'text-green-700 dark:text-green-300',
                status === 'downloading' && 'text-blue-700 dark:text-blue-300',
                status === 'error' && 'text-red-700 dark:text-red-300',
                (status === 'offline' || status === 'unavailable') &&
                  'text-gray-600 dark:text-gray-300',
                status === 'idle' && 'text-blue-700 dark:text-blue-300'
              )}
            >
              <Icon size={16} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </div>

            {status === 'downloading' ? (
              <button
                onClick={cancelDownload}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 active:bg-red-200 dark:hover:bg-red-900/40"
                aria-label={formatMessage({
                  id: 'download.cancel',
                  defaultMessage: 'Cancel download',
                })}
                title={formatMessage({
                  id: 'download.cancel',
                  defaultMessage: 'Cancel download',
                })}
              >
                <MdOutlineCancel size={18} />
              </button>
            ) : status === 'idle' || status === 'error' ? (
              <button
                onClick={() => downloadAllTracks(playlist)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
                aria-label={formatMessage({
                  id: 'download.downloadAllSurahs',
                  defaultMessage: 'Download all surahs',
                })}
                title={formatMessage({
                  id: 'download.downloadAllSurahs',
                  defaultMessage: 'Download all surahs',
                })}
              >
                <MdCloudDownload size={18} />
              </button>
            ) : null}
          </div>

          <div
            className={cn(
              'mt-1.5 h-1.5 w-full overflow-hidden rounded-full',
              status === 'saved' && 'bg-green-200 dark:bg-green-800',
              status === 'downloading' && 'bg-blue-200 dark:bg-blue-800',
              status === 'error' && 'bg-red-200 dark:bg-red-900',
              (status === 'offline' || status === 'unavailable') &&
                'bg-gray-200 dark:bg-gray-700',
              status === 'idle' && 'bg-blue-200 dark:bg-blue-800'
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                status === 'saved' && 'bg-green-500',
                status === 'downloading' && 'bg-blue-500',
                status === 'error' && 'bg-red-400',
                (status === 'offline' || status === 'unavailable') &&
                  'bg-gray-400',
                status === 'idle' && 'bg-blue-500'
              )}
              style={{ width: `${cachedPercent}%` }}
            />
          </div>

          <div
            className={cn(
              'mt-0.5 flex h-3 items-center justify-between gap-2 text-[10px]',
              status === 'saved' && 'text-green-600 dark:text-green-400',
              status === 'downloading' && 'text-blue-600 dark:text-blue-400',
              status === 'error' && 'text-red-600 dark:text-red-400',
              (status === 'offline' || status === 'unavailable') &&
                'text-gray-500 dark:text-gray-400',
              status === 'idle' && 'text-blue-500 dark:text-blue-400'
            )}
          >
            <span className="truncate">
              <FormattedMessage
                id="download.savedCount"
                defaultMessage="{cached} of {total} surahs saved"
                values={{ cached: cachedCount, total: playlist.length }}
              />
            </span>
            <span className="shrink-0">{percent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
