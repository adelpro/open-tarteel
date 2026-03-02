'use client';

import { useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { useRecentTracks } from '@/hooks/library/use-recent-tracks';
import { usePlayer } from '@/hooks/player/use-player';
import { useActiveReciter } from '@/hooks/use-active-reciter';
import { PlaylistItem } from '@/types';
import { removeTashkeel, toLibraryTrack } from '@/utils';

export default function PlaylistContent() {
  const { formatMessage, locale } = useIntl();
  const { reciter, playlist } = useActiveReciter();

  const { duration, setIsPlayListOpen, setTrackIndex } = usePlayer();
  const { markPlayed } = useRecentTracks();

  const handleOnClick = (item: PlaylistItem, index: number) => {
    setIsPlayListOpen(false);
    setTrackIndex(index);

    const track = toLibraryTrack({ reciter, duration, playlistItem: item });
    if (track) markPlayed(track);
  };

  const isEnglish = locale === 'en';

  if (!playlist) return <span>⛔ playlist not found </span>;

  return (
    <main>
      <ul className="my-2 w-full pl-3">
        {playlist.map((item: PlaylistItem, index: number) => {
          // Convert surahId to number and subtract 1 to get the correct index (since array is 0-indexed but surah IDs start at 1)
          const surahIndex = Number.parseInt(item.surahId) - 1;
          const surah = SURAHS[surahIndex];
          return (
            <li key={item.surahId}>
              <button
                onClick={() => handleOnClick(item, index)}
                className="w-full cursor-pointer rounded border-b border-gray-100 p-3 text-left text-slate-500 transition-colors duration-300 hover:bg-gray-50 hover:text-slate-800"
              >
                <span className="m-2 flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-medium">
                      {isEnglish
                        ? surah.englishName
                        : removeTashkeel(surah.name)}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {formatMessage(
                        { id: 'playlist.ayahCount', defaultMessage: 'NA' },
                        { count: surah.ayahCount }
                      )}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
