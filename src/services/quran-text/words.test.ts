import { describe, expect, it } from 'vitest';

import type { AyahData } from './types';
import {
  basmalaWordCount,
  indexWords,
  normaliseLetters,
  storedFromMp3quranV4,
  toProviderIndex,
  wordSpans,
} from './words';

const SURAH_112_1 =
  'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ';

const ayah = (t: string, b: number): AyahData => ({ t, w: 0, b, r: [] });

describe('wordSpans', () => {
  it('splits the stored 112:1 into eight pieces, basmala included', () => {
    expect(wordSpans(SURAH_112_1)).toEqual([
      { start: 0, end: 6 },
      { start: 7, end: 14 },
      { start: 15, end: 27 },
      { start: 28, end: 38 },
      { start: 39, end: 43 },
      { start: 44, end: 48 },
      { start: 49, end: 56 },
      { start: 57, end: 63 },
    ]);
  });

  it('ignores leading and trailing spaces and collapses nothing', () => {
    expect(wordSpans('  ا ب  ')).toEqual([
      { start: 2, end: 3 },
      { start: 4, end: 5 },
    ]);
  });

  it('returns nothing for an empty string', () => {
    expect(wordSpans('')).toEqual([]);
  });
});

describe('basmalaWordCount', () => {
  it('strips four words from ayah 1 of a normal surah', () => {
    expect(basmalaWordCount(SURAH_112_1, 112, 1)).toBe(4);
  });

  it('never strips from Al-Fatiha, where 1:1 is the basmala', () => {
    const fatiha = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
    expect(basmalaWordCount(fatiha, 1, 1)).toBe(0);
  });

  it('never strips from At-Tawbah, which has no basmala', () => {
    expect(basmalaWordCount('بَرَاءَةٌ مِّنَ ٱللَّهِ', 9, 1)).toBe(0);
  });

  it('returns 0 when the prefix is absent', () => {
    expect(basmalaWordCount('قُلْ هُوَ ٱللَّهُ أَحَدٌ', 112, 1)).toBe(0);
  });
});

describe('toProviderIndex', () => {
  it('makes the first non-basmala word provider word 1', () => {
    expect(toProviderIndex(5, 4)).toBe(1);
    expect(toProviderIndex(8, 4)).toBe(4);
    expect(toProviderIndex(4, 4)).toBeNull();
    expect(toProviderIndex(1, 0)).toBe(1);
  });
});

describe('indexWords', () => {
  it('numbers 112:1 both ways', () => {
    const words = indexWords(ayah(SURAH_112_1, 4));
    expect(words).toHaveLength(8);
    expect(words.map((word) => word.providerIndex)).toEqual([
      null,
      null,
      null,
      null,
      1,
      2,
      3,
      4,
    ]);
    expect(words[4]).toMatchObject({ start: 39, end: 43, storedIndex: 5 });
  });
});

describe('normaliseLetters', () => {
  it('drops marks and unifies alef forms', () => {
    expect(normaliseLetters('بِسْمِ')).toBe('بسم');
    expect(normaliseLetters('ٱللَّهِ')).toBe('الله');
  });
});

describe('MP3Quran v4 split mapping', () => {
  it('maps both halves of بعدما to one stored word (8:6)', () => {
    expect(storedFromMp3quranV4('8:6', 3)).toBe(3);
    expect(storedFromMp3quranV4('8:6', 4)).toBe(4);
    expect(storedFromMp3quranV4('8:6', 5)).toBe(4);
    expect(storedFromMp3quranV4('8:6', 6)).toBe(5);
    expect(storedFromMp3quranV4('8:6', 12)).toBe(11);
  });

  it('uses position 3 for 2:181 and 8 for 13:37', () => {
    expect(storedFromMp3quranV4('2:181', 3)).toBe(3);
    expect(storedFromMp3quranV4('2:181', 4)).toBe(3);
    expect(storedFromMp3quranV4('2:181', 5)).toBe(4);
    expect(storedFromMp3quranV4('13:37', 8)).toBe(8);
    expect(storedFromMp3quranV4('13:37', 9)).toBe(8);
    expect(storedFromMp3quranV4('13:37', 10)).toBe(9);
  });

  it('leaves every other ayah untouched', () => {
    expect(storedFromMp3quranV4('112:1', 4)).toBe(4);
    expect(storedFromMp3quranV4('37:130', 4)).toBe(4);
  });
});
