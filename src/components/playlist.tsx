'use client';

import { useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import { BsBook } from 'react-icons/bs';
import { MdCloudDone, MdCloudDownload } from 'react-icons/md';
import { FormattedMessage ,useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
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
  const [mounted, setMounted] = useState(false);
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

  const playlistLength = selectedReciter?.moshaf?.playlist?.length ?? 0;
  const { focusedIndex, reciterRefs } = useKeyboardNavigation(playlistLength);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePlaylistItemClick = (index: number) => {
    setIsOpen(false);
    setCurrentTrack(index);
  };

  
  const isArabic = language === 'ar';

  if (!selectedReciter?.moshaf?.playlist) {
    return null;
  }

  const playlist = selectedReciter.moshaf.playlist;

  // Use real cached state only after hydration to avoid mismatch
  const cachedCount = mounted ? getCachedCount(playlist) : 0;
  const allCached = mounted ? isAllCached(playlist) : false;

  return (
    <main className="animate-fade-up p-2 sm:p-4">
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="flex items-center gap-3 text-2xl font-black text-gray-800 dark:text-gray-100">
          <div className="dark:bg-brand-CTA-blue-400/10 dark:text-brand-CTA-blue-400 flex size-10 items-center justify-center rounded-xl bg-brand-CTA-blue-500/10 text-brand-CTA-blue-500">
            <BsBook className="size-5" />
          </div>
          <FormattedMessage id="playlist.title" />
          {/* {isEnglish ? 'List of Surahs' : 'قائمة السور'} */}
        </h2>

        <span className="bg-brand-CTA-blue-100 dark:bg-brand-CTA-blue-900/30 dark:text-brand-CTA-blue-400 flex items-center rounded-full px-3 py-1 text-sm font-bold text-brand-CTA-blue-600 shadow-sm">
          {playlist.length}{' '}
          <span className="mx-1 font-normal">
            <FormattedMessage id="playlist.surahs" />
            {/* {isEnglish ? 'Surahs' : 'سورة'} */}
          </span>
        </span>
      </div>

      {/* Download-all banner */}
      <div className="mb-4 px-2">
        <DownloadAllButton
          playlist={playlist}
          cachedCount={cachedCount}
          isAllCached={allCached}
          progress={progress}
          onDownloadAll={downloadAllTracks}
          onRemoveAll={removeAllTracks}
          onCancel={cancelDownload}
          checkStorageAvailable={checkStorageAvailable}
          estimateStorage={estimateStorage}
        />
      </div>

      <ul className="flex w-full flex-col gap-3">
        {playlist.map((item: PlaylistItem, index: number) => {
          const surahIndex = Number.parseInt(item.surahId) - 1;
          const surah = SURAHS[surahIndex];
          const cached = mounted && isTrackCached(item.link);
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
              ref={(element) => {
                reciterRefs.current[index] = element;
              }}
              onClick={() => handlePlaylistItemClick(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handlePlaylistItemClick(index);
                }
              }}
              tabIndex={focusedIndex === index ? 0 : -1}
              className={`hover:border-brand-CTA-blue-200 hover:from-brand-CTA-blue-50/50 dark:hover:border-brand-CTA-blue-800/50 dark:hover:from-brand-CTA-blue-900/20 group w-full cursor-pointer rounded-xl border border-gray-200/60 bg-white p-3 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-gradient-to-r hover:to-white hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/50 dark:hover:to-gray-800/80 ${
                focusedIndex === index
                  ? 'border-brand-CTA-blue-500 ring-2 ring-brand-CTA-blue-500/50'
                  : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="group-hover:bg-brand-CTA-blue-100 dark:group-hover:bg-brand-CTA-blue-900/60 dark:group-hover:text-brand-CTA-blue-400 flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500 transition-colors group-hover:text-brand-CTA-blue-600 dark:bg-gray-800 dark:text-gray-400">
                  {index + 1}
                </span>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="group-hover:text-brand-CTA-blue-700 dark:group-hover:text-brand-CTA-blue-300 text-lg font-bold text-gray-700 transition-colors dark:text-gray-200">
                      {!isArabic
                        ? surah?.englishName
                        : removeTashkeel(surah?.name)}
                    </span>

                    <span className="group-hover:bg-brand-CTA-blue-50 dark:group-hover:bg-brand-CTA-blue-900/30 dark:group-hover:text-brand-CTA-blue-300 inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-500/20 transition-colors group-hover:text-brand-CTA-blue-600 group-hover:ring-brand-CTA-blue-500/20 dark:bg-gray-800/80 dark:text-gray-400 dark:ring-gray-600/50">
                      {surah.ayahCount}{' '}
                      
                      {surah.ayahCount === 1
                          ? <FormattedMessage id="playlist.aya" />
                          : <FormattedMessage id="playlist.ayas" />
                        }
                    </span>
                  </div>

                  {/* Per-track download progress bar */}
                  {(isCurrentlyDownloading || isSingleLoading) && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
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
