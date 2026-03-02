'use client';

import React from 'react';
import { useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { usePlayer } from '@/hooks/player/use-player';
import { formatTime, removeTashkeel } from '@/utils';

export default function TrackInfo() {
  const {
    playlist,
    //
    duration,
    currentTime,
    trackIndex,
  } = usePlayer();
  const language = useIntl().locale;

  if (!Array.isArray(playlist)) return null;

  if (trackIndex < 0 || trackIndex >= playlist.length) return null;

  const currentTrack = playlist[trackIndex];

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
    <div className="mt-3 flex items-center justify-center gap-2 font-bold text-gray-500">
      <span>{`${surahId} - ${surahName()}`}</span>
      <span>{`(${formatTime(currentTime)} ${formatTime(duration)})`}</span>
    </div>
  );
}
