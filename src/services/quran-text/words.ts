import type { AyahData } from './types';

export interface WordSpan {
  /** First codepoint of the word. */
  start: number;
  /** One past the last codepoint. */
  end: number;
}

export interface IndexedWord extends WordSpan {
  /** 1-based position in the verbatim text, basmala included. */
  storedIndex: number;
  /** What a timing provider calls this word; null for basmala words. */
  providerIndex: number | null;
}

/**
 * Split on U+0020 only. This is the whole indexing rule: Tanzil has no word
 * numbers, so the words are the spaces, and this must stay identical to the
 * build script (scripts/quran-data/build.mjs). Tests compare the two.
 */
export function wordSpans(text: string): WordSpan[] {
  const spans: WordSpan[] = [];
  let start = -1;
  for (let index = 0; index <= text.length; index++) {
    const isSpace = index === text.length || text[index] === ' ';
    if (!isSpace && start === -1) start = index;
    else if (isSpace && start !== -1) {
      spans.push({ start, end: index });
      start = -1;
    }
  }
  return spans;
}

/** Diacritics off, letter variants unified. Mirrors the build script. */
export function normaliseLetters(value: string): string {
  return value
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\u0621-\u064A]/g, '');
}

const BASMALA = ['بسم', 'الله', 'الرحمن', 'الرحيم'];

/**
 * Basmala words stored at the start of ayah 1.
 * Surah 1: the basmala is ayah 1, so nothing is stripped.
 * Surah 9: there is no basmala.
 * Everything else: four words are detected by letters, not by surah number.
 */
export function basmalaWordCount(
  text: string,
  surah: number,
  ayah: number
): number {
  if (ayah !== 1 || surah === 1 || surah === 9) return 0;
  const spans = wordSpans(text);
  if (spans.length < 4) return 0;
  const head = spans
    .slice(0, 4)
    .map(({ start, end }) => normaliseLetters(text.slice(start, end)));
  return head.every((word, index) => word === BASMALA[index]) ? 4 : 0;
}

/** Provider word number for a stored word; null when it is basmala. */
export function toProviderIndex(
  storedIndex: number,
  basmalaWords: number
): number | null {
  return storedIndex <= basmalaWords ? null : storedIndex - basmalaWords;
}

/** The words of one ayah, with both numbering schemes. */
export function indexWords(ayah: AyahData): IndexedWord[] {
  return wordSpans(ayah.t).map((span, position) => ({
    ...span,
    storedIndex: position + 1,
    providerIndex: toProviderIndex(position + 1, ayah.b),
  }));
}

/**
 * MP3Quran v4 splits `بَعْدَمَا` into two timed words in these ayat. The value
 * is the position of our word that the split covers. Quran Foundation and
 * Tanzil keep it whole. See docs/follow-along/reference-index.md.
 */
export const MP3QURAN_V4_SPLITS: Readonly<Record<string, number>> = {
  '2:181': 3,
  '8:6': 4,
  '13:37': 8,
};

/**
 * Map an MP3Quran v4 word number back to ours for one ayah.
 * Both halves of the split point at the same stored word, and everything after
 * the split shifts down by one.
 */
export function storedFromMp3quranV4(
  ayahKey: string,
  providerWord: number
): number {
  const split = MP3QURAN_V4_SPLITS[ayahKey];
  if (!split) return providerWord;
  if (providerWord < split) return providerWord;
  if (providerWord <= split + 1) return split;
  return providerWord - 1;
}
