'use client';

import { useMemo } from 'react';

import {
  type AyahTimestamp,
  buildEstimatedTimestamps,
  getAyahAtTime,
} from '@/services/quran-text';
import type { SurahAyahText } from '@/types';

type UseAyahTrackingParams = {
  ayahs: SurahAyahText[];
  currentTime: number;
  duration: number;
};

type UseAyahTrackingResult = {
  /** Estimated start/end timestamps per ayah (seconds). */
  timestamps: AyahTimestamp[];
  /** Index of the ayah currently being recited, or null. */
  currentAyahIndex: number | null;
};

/**
 * Derives which ayah is playing based on the audio position.
 *
 * Uses estimated timestamps (proportional to ayah length) since the
 * full-surah audio files from mp3quran/itqan don't carry timing data.
 */
export function useAyahTracking({
  ayahs,
  currentTime,
  duration,
}: UseAyahTrackingParams): UseAyahTrackingResult {
  const timestamps = useMemo(
    () => buildEstimatedTimestamps(ayahs, duration),
    [ayahs, duration]
  );

  const currentAyahIndex = useMemo(
    () => getAyahAtTime(timestamps, currentTime),
    [timestamps, currentTime]
  );

  return { timestamps, currentAyahIndex };
}
