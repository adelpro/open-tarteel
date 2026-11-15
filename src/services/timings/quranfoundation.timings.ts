import {
  getSurahTahfeezSegments,
  getSurahWordTimestamps,
} from '@/services/reciters/quran-foundation.provider';

import type { AyahTiming, TimingProvider, WordTimingProvider } from './types';
import { parseQuranFoundationWords } from './word-timings';

export const quranFoundationTimings: TimingProvider = {
  async getSurahTimings(moshaf, surah): Promise<AyahTiming[]> {
    const segments = await getSurahTahfeezSegments(Number(moshaf.id), surah);
    if (!segments) return [];
    return segments.map((segment) => ({
      ayah: segment.ayah,
      startMs: segment.startMs,
      endMs: segment.endMs,
    }));
  },
};

/**
 * Per-word timings. A recitation without timestamps returns an empty list
 * rather than throwing, so the caller can fall back to ayah highlighting.
 */
export const quranFoundationWordTimings: WordTimingProvider = {
  async getSurahWordTimings(moshaf, surah) {
    const timestamps = await getSurahWordTimestamps(Number(moshaf.id), surah);
    return parseQuranFoundationWords(timestamps);
  },
};
