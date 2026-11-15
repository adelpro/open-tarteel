import { describe, expect, it } from 'vitest';

import {
  groupByAyah,
  MIN_WORD_COVERAGE,
  parseMp3quranV4Words,
  parseQuranFoundationWords,
  repairAyah,
} from './word-timings';

describe('parseQuranFoundationWords', () => {
  const timestamps = [
    {
      verse_key: '2:19',
      segments: [
        [1, 0, 430],
        [2, 430, 700],
        [19, 1000, 1200],
        [19, 1200, 1400],
      ],
    },
    {
      verse_key: '2:20',
      segments: [[1, 0.5, 100.25], [12231], null, [2, 100, 100]],
    },
    { verse_key: 'nonsense', segments: [[1, 0, 10]] },
  ];

  it('keeps repeated words and drops malformed rows', () => {
    const words = parseQuranFoundationWords(timestamps);

    expect(words).toEqual([
      { ayah: 19, word: 1, startMs: 0, endMs: 430 },
      { ayah: 19, word: 2, startMs: 430, endMs: 700 },
      { ayah: 19, word: 19, startMs: 1000, endMs: 1200 },
      { ayah: 19, word: 19, startMs: 1200, endMs: 1400 },
      { ayah: 20, word: 1, startMs: 0.5, endMs: 100.25 },
    ]);
  });

  it('tolerates missing payloads', () => {
    expect(parseQuranFoundationWords(undefined)).toEqual([]);
    expect(parseQuranFoundationWords([])).toEqual([]);
  });
});

describe('parseMp3quranV4Words', () => {
  it('accepts the five-field rows and rejects everything unusable', () => {
    const words = parseMp3quranV4Words([
      [6, 1, 115760, 117585, 1],
      [6, 4, 118585, 119305, 1],
      [0, 1, 2217, 7480, 1],
      [6, 2, 1],
      [6, 3, 'x', 4, 1],
      [6, 5, 10, 5, 1],
    ]);

    expect(words).toEqual([
      { ayah: 6, word: 1, startMs: 115760, endMs: 117585 },
      { ayah: 6, word: 4, startMs: 118585, endMs: 119305 },
    ]);
  });

  it('returns nothing for a non-array payload', () => {
    expect(parseMp3quranV4Words(undefined)).toEqual([]);
    expect(parseMp3quranV4Words({})).toEqual([]);
  });
});

describe('groupByAyah', () => {
  it('groups rows per ayah in arrival order', () => {
    const grouped = groupByAyah([
      { ayah: 1, word: 1, startMs: 0, endMs: 10 },
      { ayah: 2, word: 1, startMs: 10, endMs: 20 },
      { ayah: 1, word: 2, startMs: 10, endMs: 20 },
    ]);

    expect(grouped.get(1)?.map((row) => row.word)).toEqual([1, 2]);
    expect(grouped.get(2)?.map((row) => row.word)).toEqual([1]);
  });
});

describe('repairAyah', () => {
  const row = (word: number, startMs: number, endMs: number) => ({
    ayah: 1,
    word,
    startMs,
    endMs,
  });

  it('keeps every occurrence of a repeated word', () => {
    const repaired = repairAyah(
      [row(1, 0, 100), row(2, 100, 200), row(2, 200, 300), row(3, 300, 400)],
      3
    );

    expect(repaired.words.get(2)).toEqual([
      { startMs: 100, endMs: 200 },
      { startMs: 200, endMs: 300 },
    ]);
    expect(repaired.coverage).toBe(1);
    expect(repaired.fallback).toBe(false);
  });

  it('drops out-of-range words and inverted intervals', () => {
    const repaired = repairAyah(
      [row(1, 0, 100), row(5, 100, 200), row(0, 200, 300), row(2, 50, 40)],
      4
    );

    expect([...repaired.words.keys()]).toEqual([1]);
    expect(repaired.coverage).toBe(0.25);
    expect(repaired.fallback).toBe(true);
  });

  it('falls back exactly below the threshold', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((word) =>
      row(word, word * 100, word * 100 + 50)
    );
    const nine = repairAyah(rows, 10);
    const ten = repairAyah([...rows, row(10, 1000, 1050)], 10);

    expect(MIN_WORD_COVERAGE).toBe(0.85);
    expect(nine.coverage).toBe(0.9);
    expect(nine.fallback).toBe(false);
    expect(ten.coverage).toBe(1);
  });

  it('treats an empty ayah as a fallback instead of dividing by zero', () => {
    const repaired = repairAyah([], 0);
    expect(repaired.coverage).toBe(0);
    expect(repaired.fallback).toBe(true);
  });
});
