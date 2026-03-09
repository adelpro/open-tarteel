'use client';

import { useAtomValue } from 'jotai';
import React from 'react';
import { MdCloudDownload, MdCloudDone, MdClose } from 'react-icons/md';
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
  const {
    progress,
    downloadAllTracks,
    cancelDownload,
    isAllCached,
  } = useOfflineDownload();
  const playlist = selectedReciter?.moshaf.playlist;
  if (!Array.isArray(playlist)) return null;

  if (currentTrackId < 0 || currentTrackId >= playlist.length) return null;

  const currentTrack = playlist[currentTrackId];

  if (!currentTrack) return null;

  const { surahId } = currentTrack;
  const surahName = () => {
    if (language === 'en') {
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

      {/* Download all surahs inline */}
      {isDownloading ? (
        <div className="flex w-full max-w-xs flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <span>
              <FormattedMessage
                id="download.downloading"
                defaultMessage="Downloading… {completed}/{total}"
                values={{ completed: progress.completed, total: progress.total }}
              />
              {progress.downloadedBytes > 0 && (
                <span className="ms-1 text-[10px]">
                  ({formatBytes(progress.downloadedBytes)})
                </span>
              )}
            </span>
            <button
              onClick={cancelDownload}
              className="rounded-full p-0.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <MdClose size={14} />
            </button>
          </div>
          {/* Overall progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
            />
          </div>
          {/* Current surah progress */}
          {progress.currentTrackProgress > 0 && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-200"
                style={{ width: `${Math.round(progress.currentTrackProgress * 100)}%` }}
              />
            </div>
          )}
        </div>
      ) : allCached ? (
        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <MdCloudDone size={14} />
          <FormattedMessage
            id="download.allSaved"
            defaultMessage="All surahs saved offline"
          />
        </div>
      ) : (
        <button
          onClick={() => downloadAllTracks(playlist)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <MdCloudDownload size={14} />
          <FormattedMessage
            id="download.downloadAllSurahs"
            defaultMessage="Download all surahs"
          />
        </button>
      )}
    </div>
  );
}
