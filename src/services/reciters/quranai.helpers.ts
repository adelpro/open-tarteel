import { Language } from '@/constants/language';
import { Riwaya } from '@/types';

import type { QuranAiEdition, QuranAiSurahResponse } from './quranai.types';

export const QURANAI_BASE_URL = 'https://api.qurani.ai/gw/qh/v1';

export const buildSurahEndpoint = (
  surahNumber: number,
  editionIdentifier: string,
  options?: { limit?: number; offset?: number }
): string => {
  const encodedEditionIdentifier = encodeURIComponent(editionIdentifier);
  if (encodedEditionIdentifier.includes('..')) {
    throw new Error('editionIdentifier must not contain ".."');
  }
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset !== undefined) {
    params.set('offset', String(options.offset));
  }
  const query = params.toString();
  return `${QURANAI_BASE_URL}/surah/${surahNumber}/${encodedEditionIdentifier}${
    query ? `?${query}` : ''
  }`;
};

// APPROXIMATION: Quran.ai exposes 'quran-qunbul' as its own narrator identifier,
// but the repository's Riwaya enum has no Qunbul member. Qunbul is collapsed onto
// AlBazzi (the two rāwīs of the Ibn Kathir reading). This is not an exact mapping.
const NARRATOR_RIWAYA_MAP = new Map<string, Riwaya>([
  ['quran-hafs', Riwaya.Hafs],
  ['quran-warsh', Riwaya.Warsh],
  ['quran-qaloon', Riwaya.Qaloon],
  ['quran-albazzi', Riwaya.AlBazzi],
  ['quran-qunbul', Riwaya.AlBazzi],
  // APPROXIMATION: Quran.ai only reports 'quran-aldouri', which does not disambiguate
  // between Al-Doori 'an Abi 'Amr and Al-Doori 'an Al-Kisai. It is mapped to
  // AlDooriAbuAmr based on the known recordings of the reciter, not on provider data.
  ['quran-aldouri', Riwaya.AlDooriAbuAmr],
  ['quran-alsoosi', Riwaya.AlSoosi],
  ['quran-shoba', Riwaya.Shuaba],
]);

export const resolveRiwayaFromNarrator = (
  narratorIdentifier: string | null
): Riwaya => {
  if (!narratorIdentifier) {
    return Riwaya.Hafs;
  }
  return NARRATOR_RIWAYA_MAP.get(narratorIdentifier) ?? Riwaya.Hafs;
};

export const resolveReciterName = (
  edition: QuranAiEdition,
  lang: Language
): string => {
  if (lang !== 'ar') {
    return edition.englishName || edition.name;
  }
  return edition.name || edition.englishName;
};

export const extractSurahAudio = (
  data: QuranAiSurahResponse['data'] | undefined
): string | null => {
  const audio = data?.audio;
  return typeof audio === 'string' && audio.length > 0 ? audio : null;
};

export const extractSurahAudioBaseUrl = (
  probeAudioUrl: string
): string | null => {
  let url: URL;
  try {
    url = new URL(probeAudioUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }
  const filename = url.pathname.split('/').pop() ?? '';
  if (!/^\d+\.mp3$/i.test(filename)) {
    return null;
  }
  const directoryEnd = url.pathname.lastIndexOf('/') + 1;
  return `${url.origin}${url.pathname.slice(0, directoryEnd)}`;
};

export const buildSurahAudioUrl = (
  baseUrl: string,
  surahNumber: number
): string => `${baseUrl}${surahNumber}.mp3`;
