import type { QuranManifest, SurahData } from './types';

export const SURAH_COUNT = 114;
export const AYAH_COUNT = 6236;

export type { AyahData, QuranManifest, SurahData, TajweedRule } from './types';
export type { IndexedWord, WordSpan } from './words';
export {
  basmalaWordCount,
  indexWords,
  MP3QURAN_V4_SPLITS,
  normaliseLetters,
  storedFromMp3quranV4,
  toProviderIndex,
  wordSpans,
} from './words';

const DATA_PATH = '/data/quran';

/** Stable key used by both providers (`verse_key`, `ayah` + `surah`). */
export const ayahKey = (surah: number, ayah: number): string =>
  `${surah}:${ayah}`;

/**
 * One surah of verbatim text with its tajweed ranges and word counts.
 * Lazy: the mode only needs the surah being played.
 */
export async function loadSurah(
  surah: number,
  options: { signal?: AbortSignal; basePath?: string } = {}
): Promise<SurahData> {
  if (!Number.isInteger(surah) || surah < 1 || surah > SURAH_COUNT) {
    throw new RangeError(`surah out of range: ${surah}`);
  }
  const basePath = options.basePath ?? DATA_PATH;
  const response = await fetch(`${basePath}/${surah}.json`, {
    signal: options.signal,
  });
  if (!response.ok) {
    throw new Error(`surah ${surah}: HTTP ${response.status}`);
  }
  return (await response.json()) as SurahData;
}

/** Data version and digests, for the About page and the manifest display. */
export async function loadManifest(
  options: { signal?: AbortSignal; basePath?: string } = {}
): Promise<QuranManifest> {
  const basePath = options.basePath ?? DATA_PATH;
  const response = await fetch(`${basePath}/manifest.json`, {
    signal: options.signal,
  });
  if (!response.ok) {
    throw new Error(`manifest: HTTP ${response.status}`);
  }
  return (await response.json()) as QuranManifest;
}
