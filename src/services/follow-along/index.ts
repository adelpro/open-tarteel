import type { IndexedWord } from '@/services/quran-text';
import { storedFromMp3quranV4 } from '@/services/quran-text';
import type { AyahTiming } from '@/services/timings';
import type { WordInterval } from '@/services/timings/word-timings';
import { LinkSource } from '@/types';

/**
 * How far ahead of its own start a word lights up.
 *
 * This used to be 300 ms so the word was already lit when the reciter reached
 * it, but reading the line against the audio it looks like the text runs ahead
 * of the voice. Zero keeps the word on its own start; raise it only if a
 * provider's timings are consistently late.
 */
export const WORD_ANTICIPATION_MS = 0;

/** What a word is doing at this instant. */
export type WordState = 'spoken' | 'current' | 'upcoming';

/**
 * Which word is playing, from a repaired interval map.
 *
 * Intervals are half-open: `start <= t < end`. A reciter repeating a phrase
 * produces two intervals for the same word number, and both match in turn.
 * Returns null in silence, so the caller can keep the last word lit instead of
 * clearing the line.
 */
export function wordAt(
  intervals: ReadonlyMap<number, readonly WordInterval[]>,
  timeMs: number
): number | null {
  for (const [word, list] of intervals) {
    for (const interval of list) {
      if (timeMs >= interval.startMs && timeMs < interval.endMs) return word;
    }
  }
  return null;
}

/**
 * Which ayah is playing. Ayah timings must be sorted by start; the last ayah
 * whose start is at or before `timeMs` wins. Gaps and trailing silence keep the
 * previous ayah, which is what the player shows.
 */
export function ayahAt(ayahs: AyahTiming[], timeMs: number): number | null {
  if (ayahs.length === 0) return null;
  if (timeMs < ayahs[0].startMs) return ayahs[0].ayah;

  let low = 0;
  let high = ayahs.length - 1;
  let found = ayahs[0].ayah;

  while (low <= high) {
    const middle = (low + high) >> 1;
    if (ayahs[middle].startMs <= timeMs) {
      found = ayahs[middle].ayah;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return found;
}

/**
 * Provider word number to our stored word number.
 *
 * Quran Foundation numbers words after the basmala, so add the basmala count.
 * MP3Quran v4 does the same, but also splits `بَعْدَمَا` in three ayat, which
 * needs the per-ayah correction first. See docs/follow-along/reference-index.md.
 */
export function providerWordToStored(
  source: LinkSource,
  ayahKey: string,
  basmalaWords: number,
  providerWord: number
): number {
  const mapped =
    source === LinkSource.MP3QURAN_V4
      ? storedFromMp3quranV4(ayahKey, providerWord)
      : providerWord;
  return mapped + basmalaWords;
}

/**
 * State of every word on the line, relative to the active stored index.
 * A null active index means nothing has been recited yet, so everything is
 * upcoming rather than everything being spoken.
 */
export function buildLineStates(
  words: readonly Pick<IndexedWord, 'storedIndex'>[],
  activeStoredIndex: number | null
): WordState[] {
  if (activeStoredIndex == null) return words.map(() => 'upcoming');

  return words.map(({ storedIndex }) => {
    if (storedIndex < activeStoredIndex) return 'spoken';
    if (storedIndex === activeStoredIndex) return 'current';
    return 'upcoming';
  });
}
