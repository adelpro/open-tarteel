'use client';

import { useAtomValue } from 'jotai';
import React from 'react';
import { useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { selectedReciterAtom } from '@/jotai/atom';
import { formatTime, removeTashkeel } from '@/utils';

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
  const playlsit = selectedReciter?.moshaf.playlist;
  if (!Array.isArray(playlsit)) return null;

  if (currentTrackId < 0 || currentTrackId >= playlsit.length) return null;

  const currentTrack = playlsit[currentTrackId];

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

  return (
    <div className="flex items-center justify-center gap-2 font-bold text-gray-500">
      <span>{`${surahId} - ${surahName()}`}</span>
      <span>{`(${formatTime(currentTime)} ${formatTime(duration)})`}</span>
    </div>
  );
}
