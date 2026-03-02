'use client';

import { redirect } from 'next/navigation';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { usePlaylistFilter } from '@/hooks/playlist/use-playlist-filter';
import { useReciterPlayer } from '@/hooks/reciters/use-reciter-player';
import { useActiveReciter } from '@/hooks/use-active-reciter';
import { PlaylistItem } from '@/types';

import PlayListItem from './play-list-item';
import PlayListFilters from './playlist-filters';
export default function ReciterPlaylistContent() {
  const { locale } = useIntl();
  const { reciter } = useActiveReciter();
  const { playReciterTrack } = useReciterPlayer();
  const { filteredPlaylist } = usePlaylistFilter();

  const handleTrackClick = (item: PlaylistItem, index: number) => {
    playReciterTrack(index);
  };

  if (!reciter) redirect(`/${locale}/reciter`);

  return (
    <>
      <PlayListFilters />
      <ul className="divide-y divide-border/30 overflow-y-auto">
        {filteredPlaylist && filteredPlaylist?.length > 0 ? (
          filteredPlaylist?.map(({ surah, surahNumber, ...rest }) => {
            // Convert surahId to number and subtract 1 to get the correct index
            // (since array is 0-indexed but surah IDs start at 1)
            const index = surahNumber - 1;
            return (
              <PlayListItem
                surah={surah}
                key={surah.name}
                onClick={() => handleTrackClick(rest, index)}
              />
            );
          })
        ) : (
          <PlayListEmptyState />
        )}
      </ul>
    </>
  );
}

function PlayListEmptyState() {
  const { formatMessage } = useIntl();
  return (
    <li className="flex items-center justify-center px-4 py-8 text-center">
      <div className="text-muted-foreground">
        <p className="text-sm font-medium">
          {formatMessage(t('reciters.filters.empty.title'))}
        </p>
        <p className="mt-1 text-xs">
          {formatMessage(t('reciters.filters.empty.description'))}
        </p>
      </div>
    </li>
  );
}
