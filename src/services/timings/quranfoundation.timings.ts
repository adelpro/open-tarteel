import { getSurahTahfeezSegments } from '@/services/reciters/quran-foundation.provider';

import type { AyahTiming, TimingProvider } from './types';

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
