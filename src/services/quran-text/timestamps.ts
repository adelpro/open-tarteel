import type { SurahAyahText } from '@/types';

export type AyahTimestamp = {
  /** Start of the ayah in seconds (inclusive). */
  start: number;
  /** End of the ayah in seconds (exclusive). */
  end: number;
};

/**
 * Rough textual weight used to distribute the surah's total duration
 * across ayahs. Longer ayahs (more words) take proportionally longer to
 * recite, so word count is a reasonable estimator.
 */
export const ayahTextWeight = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, words);
};

/**
 * Builds estimated per-ayah timestamps by distributing `duration` across
 * ayahs proportionally to their word counts.
 *
 * These are approximations — actual reciters pause between ayahs and vary
 * their pace — but they're good enough to highlight while listening and to
 * jump between ayahs. Used as a fallback when no precise timing data exists.
 *
 * @returns An array aligned with `ayahs` where `result[i]` spans ayah `i`.
 */
export function buildEstimatedTimestamps(
  ayahs: SurahAyahText[],
  duration: number
): AyahTimestamp[] {
  if (ayahs.length === 0 || !Number.isFinite(duration) || duration <= 0) {
    return ayahs.map(() => ({ start: 0, end: 0 }));
  }

  const weights = ayahs.map((ayah) => ayahTextWeight(ayah.text));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) {
    return ayahs.map(() => ({ start: 0, end: 0 }));
  }

  const timestamps: AyahTimestamp[] = [];
  let cursor = 0;

  for (let index = 0; index < ayahs.length; index++) {
    const start = cursor;
    cursor += (duration * weights[index]) / totalWeight;
    timestamps.push({ start, end: cursor });
  }

  // Clamp the final boundary to the actual duration to avoid drift.
  timestamps[timestamps.length - 1].end = duration;

  return timestamps;
}

/**
 * Finds the index of the ayah being recited at `time` (seconds) using
 * binary search. Returns `null` when there are no timestamps or the time
 * is outside the range.
 */
export function getAyahAtTime(
  timestamps: AyahTimestamp[],
  time: number
): number | null {
  if (timestamps.length === 0 || !Number.isFinite(time) || time < 0) {
    return null;
  }

  let low = 0;
  let high = timestamps.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const { start, end } = timestamps[mid];

    if (time >= start && time < end) return mid;
    if (time < start) high = mid - 1;
    else low = mid + 1;
  }

  // Time past the last ayah's end — return the last ayah.
  return timestamps.length - 1;
}

/** Converts a surah's ayahs into plain texts for timestamp building. */
export const ayahsToTexts = (ayahs: SurahAyahText[]): string[] =>
  ayahs.map((ayah) => ayah.text);
