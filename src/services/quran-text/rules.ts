import type { AyahData } from './types';
import { wordSpans } from './words';

/** Display group for a tajweed rule id from quran-tajweed. */
export type TajweedGroup =
  | 'madd'
  | 'ghunnah'
  | 'qalqalah'
  | 'idgham'
  | 'ikhfa'
  | 'iqlab'
  | 'wasl'
  | 'shams'
  | 'silent';

/**
 * Every rule id in the dataset. The two idghaam spellings are the dataset's
 * (`mutajanisayn`, `mutaqaribayn`); the historical map used different ones and
 * left 71 annotations unstyled.
 */
export const TAJWEED_RULE_GROUPS: Readonly<Record<string, TajweedGroup>> = {
  madd_2: 'madd',
  madd_246: 'madd',
  madd_6: 'madd',
  madd_muttasil: 'madd',
  madd_munfasil: 'madd',
  ghunnah: 'ghunnah',
  qalqalah: 'qalqalah',
  idghaam_ghunnah: 'idgham',
  idghaam_no_ghunnah: 'idgham',
  idghaam_shafawi: 'idgham',
  idghaam_mutajanisayn: 'idgham',
  idghaam_mutaqaribayn: 'idgham',
  ikhfa: 'ikhfa',
  ikhfa_shafawi: 'ikhfa',
  iqlab: 'iqlab',
  hamzat_wasl: 'wasl',
  lam_shamsiyyah: 'shams',
  silent: 'silent',
};

/**
 * The rules that describe a sound the reciter makes: madd, ghunnah, qalqalah,
 * idgham, ikhfa, iqlab.
 *
 * The dataset also annotates `hamzat_wasl`, `lam_shamsiyyah` and `silent`, which
 * are facts about how the text is written and where a reading starts, not about
 * the voice. Those stay uncoloured: only an ahkam is worth marking on the line.
 */
export const AHKAM_GROUPS: readonly TajweedGroup[] = [
  'madd',
  'ghunnah',
  'qalqalah',
  'idgham',
  'ikhfa',
  'iqlab',
];

const AHKAM_SET: ReadonlySet<TajweedGroup> = new Set(AHKAM_GROUPS);

export const isAhkamGroup = (group: TajweedGroup): boolean =>
  AHKAM_SET.has(group);

export const TAJWEED_LABELS: Readonly<
  Record<TajweedGroup, { ar: string; en: string }>
> = {
  madd: { ar: 'مد', en: 'Madd' },
  ghunnah: { ar: 'غنة', en: 'Ghunnah' },
  qalqalah: { ar: 'قلقلة', en: 'Qalqalah' },
  idgham: { ar: 'إدغام', en: 'Idgham' },
  ikhfa: { ar: 'إخفاء', en: 'Ikhfa' },
  iqlab: { ar: 'إقلاب', en: 'Iqlab' },
  wasl: { ar: 'وصل', en: 'Wasl' },
  shams: { ar: 'شمسية', en: 'Shamsiyyah' },
  silent: { ar: 'صامت', en: 'Silent' },
};

/**
 * Colour per group. A CSS variable wins when the theme sets one, so light and
 * dark palettes can tune contrast without touching the component.
 */
export const TAJWEED_COLORS: Readonly<Record<TajweedGroup, string>> = {
  madd: 'var(--tajweed-madd, #e0a63c)',
  ghunnah: 'var(--tajweed-ghunnah, #58b4ae)',
  qalqalah: 'var(--tajweed-qalqalah, #d96a6a)',
  idgham: 'var(--tajweed-idgham, #8f7fd4)',
  ikhfa: 'var(--tajweed-ikhfa, #6a9fd9)',
  iqlab: 'var(--tajweed-iqlab, #d98fc4)',
  wasl: 'var(--tajweed-wasl, #9aa4b2)',
  shams: 'var(--tajweed-shams, #c9b458)',
  silent: 'var(--tajweed-silent, #8b93a1)',
};

export const ruleGroup = (
  rule: string | null | undefined
): TajweedGroup | null => (rule ? (TAJWEED_RULE_GROUPS[rule] ?? null) : null);

/** Every distinct rule group covering one word, in first-seen order. */
export const ruleGroupsForWord = (
  chars: readonly { rule?: string | null }[]
): Set<TajweedGroup> => {
  const groups = new Set<TajweedGroup>();
  for (const char of chars) {
    const group = ruleGroup(char.rule);
    if (group) groups.add(group);
  }
  return groups;
};

export interface AyahChar {
  ch: string;
  /** Rule id that covers this codepoint, or null. */
  rule: string | null;
}

/**
 * One entry per codepoint, with the rule that covers it. Later annotations win
 * where ranges overlap, matching the dataset's own precedence.
 */
export function ayahChars(ayah: AyahData): AyahChar[] {
  const ruleAt: (string | null)[] = new Array(ayah.t.length).fill(null);
  for (const [rule, start, end] of ayah.r) {
    for (
      let index = Math.max(0, start);
      index < Math.min(end, ayah.t.length);
      index++
    ) {
      ruleAt[index] = rule;
    }
  }
  return Array.from(ayah.t, (ch, index) => ({ ch, rule: ruleAt[index] }));
}

export interface AyahWordChars {
  storedIndex: number;
  chars: AyahChar[];
}

/** Split an ayah into its stored words, each with per-character rules. */
export function ayahWordChars(ayah: AyahData): AyahWordChars[] {
  const chars = ayahChars(ayah);
  return wordSpans(ayah.t).map(({ start, end }, position) => ({
    storedIndex: position + 1,
    chars: chars.slice(start, end),
  }));
}
