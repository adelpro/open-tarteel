import { describe, expect, it } from 'vitest';

import type { SurahAyahText } from '@/types';

import {
  ayahTextWeight,
  buildEstimatedTimestamps,
  getAyahAtTime,
} from './timestamps';

const makeAyahs = (texts: string[]): SurahAyahText[] =>
  texts.map((text, index) => ({ numberInSurah: index + 1, text }));

// ─────────────────────────────────────────
// ayahTextWeight
// ─────────────────────────────────────────

describe('ayahTextWeight', () => {
  it('counts words in a verse', () => {
    expect(ayahTextWeight('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBe(4);
  });

  it('collapses multiple whitespace', () => {
    expect(ayahTextWeight('  أَلْحَمْدُ  لِلَّهِ  ')).toBe(2);
  });

  it('never returns less than one', () => {
    expect(ayahTextWeight('')).toBe(1);
    expect(ayahTextWeight('   ')).toBe(1);
  });
});

// ─────────────────────────────────────────
// buildEstimatedTimestamps
// ─────────────────────────────────────────

describe('buildEstimatedTimestamps', () => {
  it('returns zero timestamps for an empty list', () => {
    expect(buildEstimatedTimestamps([], 100)).toEqual([]);
  });

  it('returns zeros when duration is not finite or <= 0', () => {
    const ayahs = makeAyahs(['كلمة', 'كلمة']);
    expect(buildEstimatedTimestamps(ayahs, 0)).toEqual([
      { start: 0, end: 0 },
      { start: 0, end: 0 },
    ]);
    expect(buildEstimatedTimestamps(ayahs, Number.NaN)).toEqual([
      { start: 0, end: 0 },
      { start: 0, end: 0 },
    ]);
  });

  it('starts at 0 and the final end equals the duration', () => {
    const ayahs = makeAyahs(['واحد', 'اثنان ثلاثة']);
    const timestamps = buildEstimatedTimestamps(ayahs, 90);
    expect(timestamps[0].start).toBe(0);
    expect(timestamps.at(-1)?.end).toBe(90);
  });

  it('weights longer ayahs with more time', () => {
    const ayahs = makeAyahs(['واحد', 'اثنان ثلاثة أربعة خمسة']);
    const timestamps = buildEstimatedTimestamps(ayahs, 60);
    const firstSpan = timestamps[0].end - timestamps[0].start;
    const secondSpan = timestamps[1].end - timestamps[1].start;
    expect(secondSpan).toBeGreaterThan(firstSpan);
  });

  it('is contiguous (no gaps or overlaps)', () => {
    const ayahs = makeAyahs(['واحد', 'اثنان', 'ثلاثة أربعة خمسة', 'ستة']);
    const timestamps = buildEstimatedTimestamps(ayahs, 120);
    for (let index = 1; index < timestamps.length; index++) {
      expect(timestamps[index].start).toBeCloseTo(timestamps[index - 1].end, 6);
    }
  });
});

// ─────────────────────────────────────────
// getAyahAtTime
// ─────────────────────────────────────────

const SAMPLE = buildEstimatedTimestamps(
  makeAyahs(['واحد', 'اثنان', 'ثلاثة أربعة خمسة', 'ستة سبعة']),
  120
);

describe('getAyahAtTime', () => {
  it('returns null for empty timestamps', () => {
    expect(getAyahAtTime([], 5)).toBeNull();
  });

  it('returns null for negative time', () => {
    expect(getAyahAtTime(SAMPLE, -1)).toBeNull();
  });

  it('finds the first ayah at the very start', () => {
    expect(getAyahAtTime(SAMPLE, 0)).toBe(0);
  });

  it('finds the correct ayah for a mid-range time', () => {
    const mid = SAMPLE[2].start + 1;
    expect(getAyahAtTime(SAMPLE, mid)).toBe(2);
  });

  it('returns the last ayah when time is past the end', () => {
    expect(getAyahAtTime(SAMPLE, 999)).toBe(SAMPLE.length - 1);
  });

  it('treats the end boundary as the next ayah (half-open intervals)', () => {
    const boundary = SAMPLE[1].end;
    expect(getAyahAtTime(SAMPLE, boundary)).toBe(2);
  });
});
