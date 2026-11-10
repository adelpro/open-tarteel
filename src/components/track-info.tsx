'use client';

import { useAtomValue } from 'jotai';
import React from 'react';
import { useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { selectedReciterAtom } from '@/jotai/atom';
import { formatTime, getSurahDisplayName } from '@/utils';

type Props = {
  currentTrackId: number;
  duration: number;
  currentTime: number;
};

/** The now-playing line under the transport. No download chrome lives here. */
export default function TrackInfo({
  currentTrackId,
  duration,
  currentTime,
}: Props) {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const { locale, formatMessage } = useIntl();
  const playlist = selectedReciter?.moshaf.playlist;

  if (!Array.isArray(playlist)) return null;
  if (currentTrackId < 0 || currentTrackId >= playlist.length) return null;

  const currentTrack = playlist[currentTrackId];
  if (!currentTrack) return null;

  const surah = SURAHS.find(
    (item) => item.id.toString() === currentTrack.surahId
  );

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[13px]">
      <span className="font-bold text-ink">
        {surah ? getSurahDisplayName(surah, locale) : currentTrack.surahId}
      </span>
      <span
        dir="ltr"
        className="tabular-nums text-ink-muted"
        aria-label={formatMessage({
          id: 'player.time',
          defaultMessage: 'Playback position',
        })}
      >
        {formatTime(currentTime)} /{' '}
        {duration > 0 ? formatTime(duration) : '--:--'}
      </span>
    </div>
  );
}
