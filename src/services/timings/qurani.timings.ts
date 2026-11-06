import { buildSurahEndpoint } from '@/services/reciters/quranai.helpers';
import { retryFetch } from '@/services/reciters/shared-fetch';

import type { AyahTiming, TimingProvider } from './types';

type Ayah = {
  numberInSurah: number;
  timings?: { startTimeMs: number; endTimeMs: number };
};

export const quranAiTimings: TimingProvider = {
  async getSurahTimings(moshaf, surah): Promise<AyahTiming[]> {
    const response = await retryFetch(
      `${buildSurahEndpoint(surah, moshaf.id)}?includeTimings=true`
    );
    const body: { data?: { ayahs?: Ayah[] } } = await response.json();

    return (body.data?.ayahs ?? [])
      .filter((ayah) => ayah.timings !== undefined)
      .map((ayah) => ({
        ayah: ayah.numberInSurah,
        startMs: ayah.timings?.startTimeMs ?? 0,
        endMs: ayah.timings?.endTimeMs ?? 0,
      }));
  },
};
