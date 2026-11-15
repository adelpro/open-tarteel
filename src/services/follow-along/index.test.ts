import { describe, expect, it } from 'vitest';

import { LinkSource } from '@/types';

import { ayahAt, buildLineStates, providerWordToStored, wordAt } from './index';

const ayahs = [
  { ayah: 1, startMs: 0, endMs: 1000 },
  { ayah: 2, startMs: 1000, endMs: 2500 },
  { ayah: 3, startMs: 2500, endMs: 4000 },
];

describe('ayahAt', () => {
  it('picks the last ayah that started', () => {
    expect(ayahAt(ayahs, 0)).toBe(1);
    expect(ayahAt(ayahs, 999)).toBe(1);
    expect(ayahAt(ayahs, 1000)).toBe(2);
    expect(ayahAt(ayahs, 3000)).toBe(3);
  });

  it('keeps the last ayah after the end and before the start', () => {
    expect(ayahAt(ayahs, 99999)).toBe(3);
    expect(ayahAt(ayahs, -500)).toBe(1);
  });

  it('returns null with no timings', () => {
    expect(ayahAt([], 100)).toBeNull();
  });
});

describe('wordAt', () => {
  const intervals = new Map([
    [1, [{ startMs: 0, endMs: 400 }]],
    [
      2,
      [
        { startMs: 400, endMs: 700 },
        { startMs: 1500, endMs: 1800 },
      ],
    ],
    [3, [{ startMs: 700, endMs: 900 }]],
  ]);

  it('matches the containing interval', () => {
    expect(wordAt(intervals, 0)).toBe(1);
    expect(wordAt(intervals, 399)).toBe(1);
    expect(wordAt(intervals, 400)).toBe(2);
    expect(wordAt(intervals, 800)).toBe(3);
  });

  it('matches the second pass of a repeated word', () => {
    expect(wordAt(intervals, 1600)).toBe(2);
  });

  it('returns null in a gap', () => {
    expect(wordAt(intervals, 1000)).toBeNull();
    expect(wordAt(intervals, 5000)).toBeNull();
  });
});

describe('providerWordToStored', () => {
  it('adds the basmala offset for Quran Foundation', () => {
    expect(
      providerWordToStored(LinkSource.QURAN_FOUNDATION, '112:1', 4, 1)
    ).toBe(5);
    expect(
      providerWordToStored(LinkSource.QURAN_FOUNDATION, '112:1', 4, 4)
    ).toBe(8);
    expect(providerWordToStored(LinkSource.QURAN_FOUNDATION, '9:1', 0, 1)).toBe(
      1
    );
  });

  it('applies the MP3Quran v4 split before the basmala offset', () => {
    expect(providerWordToStored(LinkSource.MP3QURAN_V4, '8:6', 0, 4)).toBe(4);
    expect(providerWordToStored(LinkSource.MP3QURAN_V4, '8:6', 0, 5)).toBe(4);
    expect(providerWordToStored(LinkSource.MP3QURAN_V4, '8:6', 0, 6)).toBe(5);
    expect(providerWordToStored(LinkSource.MP3QURAN_V4, '112:1', 4, 1)).toBe(5);
    expect(providerWordToStored(LinkSource.MP3QURAN_V4, '37:130', 0, 4)).toBe(
      4
    );
  });
});

describe('buildLineStates', () => {
  const words = [{ storedIndex: 1 }, { storedIndex: 2 }, { storedIndex: 3 }];

  it('marks before, current and after', () => {
    expect(buildLineStates(words, 2)).toEqual([
      'spoken',
      'current',
      'upcoming',
    ]);
  });

  it('treats everything as upcoming before playback', () => {
    expect(buildLineStates(words, null)).toEqual([
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
  });

  it('handles the first and last word', () => {
    expect(buildLineStates(words, 1)).toEqual([
      'current',
      'upcoming',
      'upcoming',
    ]);
    expect(buildLineStates(words, 3)).toEqual(['spoken', 'spoken', 'current']);
  });
});
