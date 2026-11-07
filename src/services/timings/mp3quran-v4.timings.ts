import { HttpStatusError } from '@/services/reciters/shared-fetch';

import type { AyahTiming, TimingProvider } from './types';

const DEFAULT_BASE = 'https://api-staging.mp3quran.net/v4';

const base = (): string => process.env.MP3QURAN_V4_BASE_URL || DEFAULT_BASE;

type Response = {
  data?: { ayahs?: Array<[number, number, number]> };
};

export const mp3QuranV4Timings: TimingProvider = {
  async getSurahTimings(moshaf, surah): Promise<AyahTiming[]> {
    if (!moshaf.recitationCode) return [];

    const response = await fetch(
      `${base()}/recitations/${moshaf.recitationCode}/surahs/${surah}/ayah-timings`
    );
    if (!response.ok) {
      if (response.status === 429) {
        throw new HttpStatusError(
          429,
          response.headers?.get?.('retry-after') ?? null
        );
      }
      return [];
    }

    const body: Response = await response.json();
    const rows = body.data?.ayahs ?? [];
    return rows
      .filter(([ayah]) => ayah > 0)
      .map(([ayah, startMs, endMs]) => ({ ayah, startMs, endMs }));
  },
};
