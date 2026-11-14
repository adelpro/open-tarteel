import { HttpStatusError } from '@/services/reciters/shared-fetch';

import type { AyahTiming, TimingProvider, WordTimingProvider } from './types';
import { parseMp3quranV4Words } from './word-timings';

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

type WordResponse = {
  data?: { words?: unknown; estimated?: unknown[] };
};

/**
 * Per-word timings. The recitation code contains a slash (`ibrahim-akhdar/r1`)
 * and the API expects it literally, so it is not URL-encoded here.
 */
export const mp3QuranV4WordTimings: WordTimingProvider = {
  async getSurahWordTimings(moshaf, surah) {
    if (!moshaf.recitationCode) return [];

    const response = await fetch(
      `${base()}/recitations/${moshaf.recitationCode}/surahs/${surah}/word-timings`
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

    const body: WordResponse = await response.json();
    return parseMp3quranV4Words(body.data?.words);
  },
};
