'use client';

import { useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import { BsBook } from 'react-icons/bs';
import { MdCloudDone, MdCloudDownload, MdCloudOff } from 'react-icons/md';
import { FormattedMessage, useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import { selectedReciterAtom } from '@/jotai/atom';
import { canDownload } from '@/services/reciters/capabilities';
import { removeTashkeel } from '@/utils';

import DownloadAllButton from './download-all-button';
import Tag from './ui/tag';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
  setCurrentTrack: React.Dispatch<React.SetStateAction<number | undefined>>;
};

export default function Playlist({ setIsOpen, setCurrentTrack }: Props) {
  const { formatMessage, locale: language } = useIntl();
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const [mounted, setMounted] = useState(false);
  const isOnline = useNetworkStatus();
  const {
    progress,
    singleTrackLoading,
    singleTrackProgress,
    lastError,
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

  const rawPlaylist = selectedReciter?.moshaf?.playlist;
  const downloadsEnabled = canDownload(selectedReciter?.source);

  const displayPlaylist = React.useMemo(() => {
    if (!rawPlaylist) return [];
    return rawPlaylist
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter((item) => {
        if (!mounted) return true;
        if (!isOnline) {
          return isTrackCached(item.link);
        }
        return true;
      });
  }, [rawPlaylist, mounted, isOnline, isTrackCached]);

  const playlist = rawPlaylist ?? [];

  const { focusedIndex, reciterRefs } = useKeyboardNavigation(
    displayPlaylist.length
  );

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

  // Use real cached state only after hydration to avoid mismatch
  const cachedCount = mounted ? getCachedCount(playlist) : 0;
  const allCached = mounted ? isAllCached(playlist) : false;

  return (
    <div className="animate-fade-up p-2 sm:p-4">
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="flex items-center gap-3 text-2xl font-black text-gray-800 dark:text-gray-100">
          <div className="dark:bg-brand-CTA-blue-400/10 dark:text-brand-CTA-blue-400 flex size-10 items-center justify-center rounded-xl bg-brand-CTA-blue-500/10 text-brand-CTA-blue-500">
            <BsBook className="size-5" />
          </div>
          <FormattedMessage id="playlist.title" />
        </h2>

        <Tag variant="static" size="md">
          {displayPlaylist.length}{' '}
          <span className="font-normal">
            <FormattedMessage id="playlist.surahs" />
          </span>
        </Tag>
      </div>

      {/* Download-all banner - stable slot so state changes never move the list */}
      <div className="mb-4 px-2">
        {downloadsEnabled ? (
          <DownloadAllButton
            playlist={playlist}
            cachedCount={cachedCount}
            isAllCached={allCached}
            isOnline={isOnline}
            progress={progress}
            error={lastError}
            onDownloadAll={downloadAllTracks}
            onRemoveAll={removeAllTracks}
            onCancel={cancelDownload}
            checkStorageAvailable={checkStorageAvailable}
            estimateStorage={estimateStorage}
          />
        ) : (
          <div
            role="note"
            className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
          >
            <MdCloudOff
              size={18}
              className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p className="font-semibold text-gray-700 dark:text-gray-200">
                <FormattedMessage
                  id="download.unavailableTitle"
                  defaultMessage="Download unavailable for this provider"
                />
              </p>
              <p>
                <FormattedMessage
                  id="download.unavailableBody"
                  defaultMessage="This provider blocks browser downloads. You can still stream this reciter."
                />
              </p>
            </div>
          </div>
        )}
      </div>

      {displayPlaylist.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-gray-500 dark:text-gray-400">
          <MdCloudDone className="size-12 text-gray-400 dark:text-gray-500" />
          <p className="max-w-md font-medium">
            {!isOnline
              ? formatMessage({
                  id: 'offline.noDownloadedSurahs',
                  defaultMessage:
                    'No downloaded surahs for this reciter. Connect to the internet to stream or download.',
                })
              : formatMessage({
                  id: 'noRecitersFound',
                  defaultMessage: 'No surahs found.',
                })}
          </p>
        </div>
      ) : (
        <ul className="flex w-full flex-col gap-3">
          {displayPlaylist.map((item, index: number) => {
            const surahNumber = Number.parseInt(item.surahId, 10);
            const surahIndex = surahNumber - 1;
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
                key={item.link}
                className={`group w-full rounded-[12px] border border-border bg-surface p-3 transition-colors duration-120 hover:bg-surface-sunken ${
                  focusedIndex === index ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    ref={(element) => {
                      reciterRefs.current[index] = element;
                    }}
                    onClick={() => handlePlaylistItemClick(item.originalIndex)}
                    className="flex min-w-0 flex-1 items-center gap-4 rounded-[10px] text-start"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[13px] font-bold text-ink-muted transition-colors duration-120 group-hover:text-primary">
                      {surahNumber || index + 1}
                    </span>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-ink">
                        {!isArabic
                          ? surah?.englishName
                          : removeTashkeel(surah?.name)}
                      </span>

                      <Tag variant="static" size="xs">
                        {surah?.ayahCount}{' '}
                        {surah?.ayahCount === 1 ? (
                          <FormattedMessage id="playlist.aya" />
                        ) : (
                          <FormattedMessage id="playlist.ayas" />
                        )}
                      </Tag>
                    </div>

                    {/* Per-track download progress: reserve the row height */}
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-transparent">
                      {(isCurrentlyDownloading || isSingleLoading) && (
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-200"
                          style={{
                            width: `${trackProgress ?? 0}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  </button>

                  {/* Per-track download/remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cached) {
                        removeTrack(item.link);
                      } else if (isSingleLoading) {
                        cancelSingleDownload();
                      } else if (!isCurrentlyDownloading && isOnline) {
                        downloadTrack(item.link);
                      }
                    }}
                    disabled={isCurrentlyDownloading || (!cached && !isOnline)}
                    className="relative ms-2 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-120 hover:bg-surface-sunken disabled:opacity-50"
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
                        className="h-4 w-4 animate-spin text-primary"
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
                      <MdCloudDone size={18} className="text-success" />
                    ) : (
                      <MdCloudDownload size={18} className="text-primary" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
