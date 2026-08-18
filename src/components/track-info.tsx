'use client';

import { useAtomValue } from 'jotai';
import React from 'react';
import { MdCloudDone, MdCloudDownload, MdOutlineCancel } from 'react-icons/md';
import { FormattedMessage, useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import { selectedReciterAtom } from '@/jotai/atom';
import { formatBytes, formatTime, removeTashkeel } from '@/utils';

type Props = {
  currentTrackId: number;
  duration: number;
  currentTime: number;
};

export default function TrackInfo({
  currentTrackId,
  duration,
  currentTime,
}: Props) {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const language = useIntl().locale;
  const { progress, downloadAllTracks, cancelDownload, isAllCached } =
    useOfflineDownload();
  const playlist = selectedReciter?.moshaf.playlist;
  if (!Array.isArray(playlist)) return null;

  if (currentTrackId < 0 || currentTrackId >= playlist.length) return null;

  const currentTrack = playlist[currentTrackId];

  if (!currentTrack) return null;

  const { surahId } = currentTrack;
  const surahName = () => {
    if (language !== 'ar') {
      return SURAHS.find((surah) => surah.id.toString() === surahId)
        ?.englishName;
    }

    return removeTashkeel(
      SURAHS.find((surah) => surah.id.toString() === surahId)?.name || ''
    );
  };

  const allCached = isAllCached(playlist);
  const isDownloading = progress !== null;

  return (
    <div className="mt-3 flex flex-col items-center justify-center gap-1">
      <div className="flex items-center gap-2 font-bold text-gray-500">
        <span>{`${surahId} - ${surahName()}`}</span>
        <span>{`(${formatTime(currentTime)} ${formatTime(duration)})`}</span>
      </div>

      {/* Fixed-height download status area to prevent player card height changes */}
      <div className="min-h-[52px] w-full max-w-xs">
        {isDownloading ? (
          <div className="flex w-full flex-col gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
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
              {/* Larger, more visible cancel button */}
              <button
                onClick={cancelDownload}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 active:bg-red-200 dark:hover:bg-red-900/40"
                aria-label="Cancel download"
                title="Cancel download"
              >
                <MdOutlineCancel size={20} />
              </button>
            </div>
            {/* Overall progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${Math.round((progress.completed / progress.total) * 100)}%`,
                }}
              />
            </div>
            {/* Current surah progress */}
            {progress.currentTrackProgress > 0 && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all duration-200"
                  style={{
                    width: `${Math.round(progress.currentTrackProgress * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        ) : allCached ? (
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-600 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
            <MdCloudDone size={16} />
            <FormattedMessage
              id="download.allSaved"
              defaultMessage="All surahs saved offline"
            />
          </div>
        ) : (
          <button
            onClick={() => downloadAllTracks(playlist)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            <MdCloudDownload size={16} />
            <FormattedMessage
              id="download.downloadAllSurahs"
              defaultMessage="Download all surahs"
            />
          </button>
        )}
      </div>
    </div>
  );
}
