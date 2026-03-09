'use client';
import { useAtomValue } from 'jotai';
import React from 'react';
import { MdCloudDone, MdCloudDownload } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import { selectedReciterAtom } from '@/jotai/atom';
import { PlaylistItem } from '@/types';
import { removeTashkeel } from '@/utils';

import DownloadAllButton from './download-all-button';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
  setCurrentTrack: React.Dispatch<React.SetStateAction<number | undefined>>;
};

export default function Playlist({ setIsOpen, setCurrentTrack }: Props) {
  const { formatMessage, locale: language } = useIntl();
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const {
    progress,
    singleTrackLoading,
    singleTrackProgress,
    downloadTrack,
    downloadAllTracks,
    cancelDownload,
    cancelSingleDownload,
    removeTrack,
    removeAllTracks,
    isTrackCached,
    getCachedCount,
    isAllCached,
    checkStorageAvailable,
    estimateStorage,
  } = useOfflineDownload();

  const handlePlaylistItemClick = (index: number) => {
    setIsOpen(false);
    setCurrentTrack(index);
  };

  const isEnglish = language === 'en';
  const playlist = selectedReciter?.moshaf?.playlist;

  if (!playlist) {
    return <></>;
  }

  return (
    <main>
      {/* Download-all banner */}
      <div className="mx-4 mt-2">
        <DownloadAllButton
          playlist={playlist}
          cachedCount={getCachedCount(playlist)}
          isAllCached={isAllCached(playlist)}
          progress={progress}
          onDownloadAll={downloadAllTracks}
          onRemoveAll={removeAllTracks}
          onCancel={cancelDownload}
          checkStorageAvailable={checkStorageAvailable}
          estimateStorage={estimateStorage}
        />
      </div>

      <ul className="my-2 w-full pl-3">
        {playlist.map((item: PlaylistItem, index: number) => {
          const surahIndex = Number.parseInt(item.surahId) - 1;
          const surah = SURAHS[surahIndex];
          const cached = isTrackCached(item.link);
          const isCurrentlyDownloading = progress?.currentUrl === item.link;
          const isSingleLoading = singleTrackLoading === item.link;
          const trackProgress = isCurrentlyDownloading
            ? Math.round(progress.currentTrackProgress * 100)
            : isSingleLoading
              ? Math.round(singleTrackProgress * 100)
              : null;

          return (
            <li
              key={index}
              className="mx-2 my-3 w-full cursor-pointer rounded border-b border-gray-100 p-3 text-slate-500 transition-colors duration-300 hover:bg-gray-50 hover:text-slate-800 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-slate-200"
              onClick={() => handlePlaylistItemClick(index)}
            >
              <div className="flex items-center">
                <span className="m-2 flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium dark:bg-gray-800">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-medium">
                      {isEnglish
                        ? surah.englishName
                        : removeTashkeel(surah.name)}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400">
                      {surah.ayahCount}{' '}
                      {isEnglish
                        ? surah.ayahCount === 1
                          ? 'Aya'
                          : 'Ayas'
                        : surah.ayahCount === 1
                          ? 'آية'
                          : 'آيات'}
                    </span>
                  </div>
                  {/* Per-track download progress bar */}
                  {(isCurrentlyDownloading || isSingleLoading) && (
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-200"
                        style={{
                          width: `${trackProgress ?? 0}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                {/* Per-track download/remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cached) {
                      removeTrack(item.link);
                    } else if (isSingleLoading) {
                      cancelSingleDownload();
                    } else if (!isCurrentlyDownloading) {
                      downloadTrack(item.link);
                    }
                  }}
                  disabled={isCurrentlyDownloading}
                  className="relative ms-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                  aria-label={
                    cached
                      ? formatMessage({
                          id: 'download.removeSurah',
                          defaultMessage: 'Remove download',
                        })
                      : formatMessage({
                          id: 'download.surah',
                          defaultMessage: 'Download surah',
                        })
                  }
                  title={
                    cached
                      ? formatMessage({
                          id: 'download.removeSurah',
                          defaultMessage: 'Remove download',
                        })
                      : formatMessage({
                          id: 'download.surah',
                          defaultMessage: 'Download surah',
                        })
                  }
                >
                  {isCurrentlyDownloading || isSingleLoading ? (
                    <svg
                      className="h-4 w-4 animate-spin text-blue-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : cached ? (
                    <MdCloudDone size={18} className="text-green-500" />
                  ) : (
                    <MdCloudDownload
                      size={18}
                      className="text-blue-400 hover:text-blue-600"
                    />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
