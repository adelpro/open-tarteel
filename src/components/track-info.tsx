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

/**
 * The now-playing identity at the top of the player: surah at 18/700 and the
 * reciter beneath it at 13 muted (DESIGN.md Section / Meta). It belongs above
 * the controls, not below them.
 */
export function NowPlayingHeader({
  currentTrackId,
}: {
  currentTrackId: number;
}) {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const { locale } = useIntl();
  const playlist = selectedReciter?.moshaf.playlist;

  if (!Array.isArray(playlist)) return null;
  if (currentTrackId < 0 || currentTrackId >= playlist.length) return null;
  const currentTrack = playlist[currentTrackId];
  if (!currentTrack) return null;

  const surah = SURAHS.find(
    (item) => item.id.toString() === currentTrack.surahId
  );
  const surahName = surah
    ? getSurahDisplayName(surah, locale)
    : currentTrack.surahId;
  if (!surahName || !selectedReciter) return null;

  return (
    <div className="w-full pb-1 text-center">
      <p className="truncate text-[18px] font-bold leading-tight text-ink">
        {surahName}
      </p>
      <p className="truncate text-[13px] text-ink-muted">
        {selectedReciter.name}
        {selectedReciter.moshaf.name
          ? ` · ${selectedReciter.moshaf.name}`
          : null}
      </p>
    </div>
  );
}

/** The single metadata line under the transport: playback time only. */
export default function TrackInfo({
  currentTrackId,
  duration,
  currentTime,
}: Props) {
  const { formatMessage } = useIntl();
  const playlist = useAtomValue(selectedReciterAtom)?.moshaf.playlist;

  if (!Array.isArray(playlist)) return null;
  if (currentTrackId < 0 || currentTrackId >= playlist.length) return null;
  if (!playlist[currentTrackId]) return null;

  return (
    <div className="mt-2 flex w-full justify-center">
      <span
        dir="ltr"
        className="text-[12px] tabular-nums text-ink-muted"
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
