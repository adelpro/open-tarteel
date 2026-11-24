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

/** The single metadata line under the transport: time and surah identity. */
export default function TrackInfo({
  currentTrackId,
  duration,
  currentTime,
}: Props) {
  const { formatMessage, locale } = useIntl();
  const playlist = useAtomValue(selectedReciterAtom)?.moshaf.playlist;

  if (!Array.isArray(playlist)) return null;
  if (currentTrackId < 0 || currentTrackId >= playlist.length) return null;
  const track = playlist[currentTrackId];
  if (!track) return null;

  const surah = SURAHS.find(
    (item) => item.id.toString() === track.surahId
  );
  const surahName = surah
    ? getSurahDisplayName(surah, locale)
    : track.surahId;

  return (
    <div className="mt-2 flex w-full justify-center">
      <p
        className="flex items-center gap-2 text-[12px] text-ink-muted"
        aria-label={`${formatMessage({
          id: 'player.time',
          defaultMessage: 'Playback position',
        })} - ${surahName}`}
      >
        <span dir="ltr" className="tabular-nums">
          {formatTime(currentTime)} /{' '}
          {duration > 0 ? formatTime(duration) : '--:--'}
        </span>
        <span aria-hidden="true">-</span>
        <span>{surahName}</span>
      </p>
    </div>
  );
}
