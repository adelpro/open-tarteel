import { HttpStatusError } from '@/services/reciters/shared-fetch';

import type { AyahTiming, TimingProvider } from './types';

const BASE = 'https://www.mp3quran.net/api/v3';

type Row = { ayah: number; start_time: number; end_time: number };

export const mp3QuranV3Timings: TimingProvider = {
  async getSurahTimings(moshaf, surah): Promise<AyahTiming[]> {
    const response = await fetch(
      `${BASE}/ayat_timing?surah=${surah}&read=${encodeURIComponent(moshaf.id)}`
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

    const body: unknown = await response.json();
    if (!Array.isArray(body)) return [];

    return (body as Row[])
      .filter((row) => row.ayah > 0)
      .map((row) => ({
        ayah: row.ayah,
        startMs: row.start_time,
        endMs: row.end_time,
      }));
  },
};
