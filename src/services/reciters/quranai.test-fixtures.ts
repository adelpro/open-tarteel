import { vi } from 'vitest';

import type {
  QuranAiEdition,
  QuranAiEditionListResponse,
  QuranAiSurahResponse,
} from './quranai.types';

export const makeFetchResponse = (data: unknown): Promise<Response> =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as unknown as Response);

export const makeEdition = (
  overrides: Partial<QuranAiEdition>
): QuranAiEdition => ({
  identifier: 'ar.ibrahimakhdar.hafs',
  language: 'ar',
  name: 'إبراهيم الأخضر',
  englishName: 'Ibrahim Al-Akhdar',
  format: 'audio',
  type: 'surah',
  direction: null,
  narratorIdentifier: 'quran-hafs',
  ...overrides,
});

export const makeEditionsResponse = (): QuranAiEditionListResponse => ({
  code: 200,
  status: 'OK',
  data: [
    makeEdition({}),
    makeEdition({ type: 'surah' }),
    makeEdition({
      identifier: 'ar.ghamdi.hafs',
      name: 'سعد الغامدي',
      englishName: 'Saad Al-Ghamdi',
    }),
    makeEdition({
      identifier: 'ar.sufi.hafs',
      name: 'عبد الباسط عبد الصمد',
      englishName: 'Abdul Basit',
      type: 'versebyverse',
    }),
  ],
});

export const makeSurahResponse = (
  audio: string,
  ayahCount = 7,
  ayahAudio = audio
): QuranAiSurahResponse => ({
  code: 200,
  status: 'OK',
  data: {
    number: 2,
    numberOfAyahs: ayahCount,
    audio,
    ayahs: Array.from({ length: ayahCount }, (_, index) => ({
      number: 8 + index,
      numberInSurah: index + 1,
      audio: ayahAudio
        ? `https://quranhub.b-cdn.net/quran/audio/versebyverse/32/ar.ibrahimakhdar.hafs/${8 + index}.mp3`
        : '',
    })),
    edition: {
      identifier: 'ar.ibrahimakhdar.hafs',
      type: 'surah',
    },
  },
});

export const PROBE_IBRAHIM_URL =
  'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/1.mp3';

export const createDefaultFetchMock = () =>
  vi.fn().mockImplementation((url: string) => {
    if (url.includes('/edition/')) {
      return makeFetchResponse(makeEditionsResponse());
    }
    if (url.includes('/surah/1/ar.ibrahimakhdar.hafs')) {
      return makeFetchResponse(makeSurahResponse(PROBE_IBRAHIM_URL));
    }
    if (url.includes('/surah/1/ar.ghamdi.hafs')) {
      return makeFetchResponse(makeSurahResponse(''));
    }
    if (url.includes('/surah/2/ar.ibrahimakhdar.hafs')) {
      return makeFetchResponse(makeSurahResponse('', 7, 'audio-present'));
    }
    return makeFetchResponse(makeSurahResponse(''));
  });
