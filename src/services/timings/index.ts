import type { Moshaf } from '@/types';
import { LinkSource } from '@/types';

import { itqanTimings } from './itqan.timings';
import { mp3QuranV3Timings } from './mp3quran-v3.timings';
import {
  mp3QuranV4Timings,
  mp3QuranV4WordTimings,
} from './mp3quran-v4.timings';
import {
  quranFoundationTimings,
  quranFoundationWordTimings,
} from './quranfoundation.timings';
import { quranAiTimings } from './qurani.timings';
import type {
  AyahTiming,
  TimingProvider,
  WordTiming,
  WordTimingProvider,
} from './types';

const providers: Partial<Record<LinkSource, TimingProvider>> = {
  [LinkSource.MP3QURAN]: mp3QuranV3Timings,
  [LinkSource.MP3QURAN_V4]: mp3QuranV4Timings,
  [LinkSource.ITQAN]: itqanTimings,
  [LinkSource.QURANAI]: quranAiTimings,
  [LinkSource.QURAN_FOUNDATION]: quranFoundationTimings,
};

/**
 * Only two providers publish word indices today. Everything else returns an
 * empty list, which the caller reads as "no word-level follow for this source".
 */
const wordProviders: Partial<Record<LinkSource, WordTimingProvider>> = {
  [LinkSource.QURAN_FOUNDATION]: quranFoundationWordTimings,
  [LinkSource.MP3QURAN_V4]: mp3QuranV4WordTimings,
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

export const getSurahWordTimings = async (
  source: LinkSource,
  moshaf: Moshaf,
  surah: number
): Promise<WordTiming[]> => {
  const provider = wordProviders[source];
  if (!provider) return [];
  return provider.getSurahWordTimings(moshaf, surah);
};

export type { AyahTiming, TimingProvider, WordTiming, WordTimingProvider };
