import type { WordTiming } from './types';

/** Below this share of timed words, highlight the ayah instead. */
export const MIN_WORD_COVERAGE = 0.85;

export type WordInterval = {
  startMs: number;
  endMs: number;
};

export type AyahWordTimings = {
  /** Every interval per provider word number; repeats are kept. */
  words: Map<number, WordInterval[]>;
  /** Distinct timed words divided by the reference word count. */
  coverage: number;
  /** True when coverage is below {@link MIN_WORD_COVERAGE}. */
  fallback: boolean;
};

const toNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const isSegment = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) &&
  value.length >= 3 &&
  typeof value[0] === 'number' &&
  typeof value[1] === 'number' &&
  typeof value[2] === 'number';

/**
 * Quran Foundation: `audio_file.timestamps[].segments = [[word, start, end]]`
 * per verse. Rows can be repeated (the reciter repeats a phrase), and some
 * rows arrive malformed (`[12231]`) or as floats under OAuth. Keep repeats,
 * drop anything that cannot be used.
 */
export function parseQuranFoundationWords(
  timestamps:
    Array<{ verse_key?: string; segments?: unknown }> | null | undefined
): WordTiming[] {
  if (!timestamps) return [];
  const words: WordTiming[] = [];

  for (const stamp of timestamps) {
    const ayah = Number(String(stamp.verse_key ?? '').split(':')[1]);
    if (!Number.isInteger(ayah) || ayah < 1) continue;

    const segments = Array.isArray(stamp.segments) ? stamp.segments : [];
    for (const segment of segments) {
      if (!isSegment(segment)) continue;
      const [word, startMs, endMs] = segment;
      if (!Number.isInteger(word) || word < 1) continue;
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;
      if (endMs <= startMs) continue;
      words.push({ ayah, word, startMs, endMs });
    }
  }

  return words;
}

/**
 * MP3Quran v4: `data.words = [[ayah, word, start, end, flag]]` for the whole
 * surah. The flag is undocumented and never used. `ayah: 0` is the opening
 * basmala and never carries words, but it is skipped defensively.
 */
export function parseMp3quranV4Words(rows: unknown): WordTiming[] {
  if (!Array.isArray(rows)) return [];
  const words: WordTiming[] = [];

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 4) continue;
    const ayah = toNumber(row[0]);
    const word = toNumber(row[1]);
    const startMs = toNumber(row[2]);
    const endMs = toNumber(row[3]);
    if (ayah == null || word == null || startMs == null || endMs == null) {
      continue;
    }
    if (!Number.isInteger(ayah) || ayah < 1) continue;
    if (!Number.isInteger(word) || word < 1) continue;
    if (endMs <= startMs) continue;
    words.push({ ayah, word, startMs, endMs });
  }

  return words;
}

/** Group a flat provider list by ayah. */
export function groupByAyah(words: WordTiming[]): Map<number, WordTiming[]> {
  const grouped = new Map<number, WordTiming[]>();
  for (const row of words) {
    const list = grouped.get(row.ayah) ?? [];
    list.push(row);
    grouped.set(row.ayah, list);
  }
  return grouped;
}

/**
 * Turn one ayah's provider words into intervals that can drive a highlight.
 *
 * Drops word numbers outside `1..wordCount` (ayah markers and finer splits),
 * keeps every occurrence of a repeated word, and reports coverage against the
 * reference word count so the caller can fall back to ayah highlighting.
 */
export function repairAyah(
  rows: WordTiming[],
  wordCount: number
): AyahWordTimings {
  const words = new Map<number, WordInterval[]>();

  for (const row of rows) {
    if (!Number.isFinite(row.startMs) || !Number.isFinite(row.endMs)) continue;
    if (row.endMs <= row.startMs) continue;
    if (!Number.isInteger(row.word)) continue;
    if (row.word < 1 || row.word > wordCount) continue;

    const list = words.get(row.word) ?? [];
    list.push({ startMs: row.startMs, endMs: row.endMs });
    words.set(row.word, list);
  }

  const coverage = wordCount > 0 ? words.size / wordCount : 0;
  return {
    words,
    coverage,
    fallback: coverage < MIN_WORD_COVERAGE,
  };
}
