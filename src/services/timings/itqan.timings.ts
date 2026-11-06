import { retryFetch } from '@/services/reciters/shared-fetch';

import type { AyahTiming, TimingProvider } from './types';

const BASE = 'https://api.cms.itqan.dev';

type Track = {
  surah_number: number;
  ayahs_timings: Array<{ ayah_key: string; start_ms: number; end_ms: number }>;
};

export const itqanTimings: TimingProvider = {
  async getSurahTimings(moshaf, surah): Promise<AyahTiming[]> {
    const response = await retryFetch(
      `${BASE}/recitations/${moshaf.id}?page_size=200`,
      undefined,
      undefined,
      { headers: { 'Accept-Language': 'ar' } }
    );
    const body: { results?: Track[] } = await response.json();
    const track = body.results?.find((row) => row.surah_number === surah);
    if (!track) return [];

    return track.ayahs_timings.map((timing) => ({
      ayah: Number(timing.ayah_key.split(':')[1]),
      startMs: timing.start_ms,
      endMs: timing.end_ms,
    }));
  },
};
