import type { TajweedGroup } from '@/services/quran-text/rules';
import {
  AHKAM_GROUPS,
  ayahWordChars,
  ruleGroup,
} from '@/services/quran-text/rules';
import type { AyahData } from '@/services/quran-text/types';

/** Order is the tie-break when two rules cover the same number of characters. */
const AHKAM_ORDER = new Map(AHKAM_GROUPS.map((group, index) => [group, index]));

/**
 * One rule per word, at word granularity.
 *
 * A word can carry several rules at once. We show the one covering the most
 * characters, because a rail entry has to be a single label. This is a display
 * choice: it claims nothing about how the word is recited.
 *
 * There is no start or end time here on purpose. Rule spans would have to be
 * spread across a word's interval by proportion, which is a guess, and a guess
 * drawn against the audio reads as a measurement.
 */
export interface AyahAhkam {
  /** Stored word index, the same coordinate the line highlight uses. */
  storedIndex: number;
  group: TajweedGroup;
}

const dominantGroup = (
  counts: Map<TajweedGroup, number>
): TajweedGroup | null => {
  let best: TajweedGroup | null = null;
  let bestCount = 0;

  for (const [group, count] of counts) {
    const rank = AHKAM_ORDER.get(group) ?? Number.MAX_SAFE_INTEGER;
    const bestRank =
      best == null ? Number.MAX_SAFE_INTEGER : (AHKAM_ORDER.get(best) ?? 0);
    if (count > bestCount || (count === bestCount && rank < bestRank)) {
      best = group;
      bestCount = count;
    }
  }

  return best;
};

/**
 * The ahkam of one ayah, in word order.
 *
 * Basmala words are skipped: they are stored inside ayah 1 but rendered on
 * their own, so a rail entry for them would point at a word the line never
 * highlights. Only the ayah the player is on is walked, which keeps this cheap
 * on long ayat.
 */
export function ayahAhkam(ayah: AyahData): AyahAhkam[] {
  const ahkam: AyahAhkam[] = [];

  for (const word of ayahWordChars(ayah)) {
    if (word.storedIndex <= ayah.b) continue;

    const counts = new Map<TajweedGroup, number>();
    for (const char of word.chars) {
      const group = ruleGroup(char.rule);
      if (group == null || !AHKAM_ORDER.has(group)) continue;
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }

    const group = dominantGroup(counts);
    if (group) ahkam.push({ storedIndex: word.storedIndex, group });
  }

  return ahkam;
}
