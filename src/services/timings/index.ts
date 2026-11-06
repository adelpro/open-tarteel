import type { Moshaf } from '@/types';
import { LinkSource } from '@/types';

import { itqanTimings } from './itqan.timings';
import { mp3QuranV3Timings } from './mp3quran-v3.timings';
import { mp3QuranV4Timings } from './mp3quran-v4.timings';
import { quranFoundationTimings } from './quranfoundation.timings';
import { quranAiTimings } from './qurani.timings';
import type { AyahTiming, TimingProvider } from './types';

const providers: Partial<Record<LinkSource, TimingProvider>> = {
  [LinkSource.MP3QURAN]: mp3QuranV3Timings,
  [LinkSource.MP3QURAN_V4]: mp3QuranV4Timings,
  [LinkSource.ITQAN]: itqanTimings,
  [LinkSource.QURANAI]: quranAiTimings,
  [LinkSource.QURAN_FOUNDATION]: quranFoundationTimings,
};

export const getSurahTimings = async (
  source: LinkSource,
  moshaf: Moshaf,
  surah: number
): Promise<AyahTiming[]> => {
  const provider = providers[source];
  if (!provider) return [];
  return provider.getSurahTimings(moshaf, surah);
};

export type { AyahTiming, TimingProvider };
