import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ayahChars,
  ayahWordChars,
  ruleGroup,
  ruleGroupsForWord,
  TAJWEED_RULE_GROUPS,
} from './rules';
import type { AyahData } from './types';

const DIR = join(process.cwd(), 'public/data/quran');

const load = (surah: number): { ayahs: AyahData[] } =>
  JSON.parse(readFileSync(join(DIR, `${surah}.json`), 'utf8'));

describe('tajweed rule map', () => {
  it('covers every rule id that appears in the data', () => {
    const unknown = new Set<string>();
    const rules = new Set<string>();

    for (let surah = 1; surah <= 114; surah++) {
      for (const ayah of load(surah).ayahs) {
        for (const [rule] of ayah.r) {
          rules.add(rule);
          if (!TAJWEED_RULE_GROUPS[rule]) unknown.add(rule);
        }
      }
    }

    expect([...unknown]).toEqual([]);
    expect(rules.size).toBe(18);
  });

  it('maps the two spellings the old map missed', () => {
    expect(ruleGroup('idghaam_mutajanisayn')).toBe('idgham');
    expect(ruleGroup('idghaam_mutaqaribayn')).toBe('idgham');
  });

  it('returns null for unknown and empty rules', () => {
    expect(ruleGroup(null)).toBeNull();
    expect(ruleGroup(undefined)).toBeNull();
    expect(ruleGroup('nope')).toBeNull();
  });
});

describe('ayahChars', () => {
  it('places the rule on the exact codepoint', () => {
    const ayah = load(112).ayahs[0];
    const chars = ayahChars(ayah);

    expect(chars).toHaveLength(ayah.t.length);
    expect(chars[49]).toEqual({ ch: 'ٱ', rule: 'hamzat_wasl' });
    expect(chars[61]).toEqual({ ch: 'د', rule: 'qalqalah' });
    expect(chars[39]).toEqual({ ch: 'ق', rule: null });
  });

  it('ignores out-of-range annotations instead of crashing', () => {
    const ayah: AyahData = {
      t: 'abc',
      w: 1,
      b: 0,
      r: [['madd_2', 2, 99]],
    };
    expect(ayahChars(ayah).map((char) => char.rule)).toEqual([
      null,
      null,
      'madd_2',
    ]);
  });
});

describe('ayahWordChars', () => {
  it('splits 112:1 into eight words with the basmala first', () => {
    const ayah = load(112).ayahs[0];
    const words = ayahWordChars(ayah);
    const stored = ayah.t.split(' ');

    expect(words).toHaveLength(8);
    expect(words[0].chars.map((char) => char.ch).join('')).toBe(stored[0]);
    expect(words[6].chars.map((char) => char.ch).join('')).toBe(stored[6]);
    expect(words[6].chars[0].rule).toBe('hamzat_wasl');
  });
});

describe('ruleGroupsForWord', () => {
  it('returns every rule group on a word, de-duplicated', () => {
    expect(
      ruleGroupsForWord([
        { rule: 'madd_2' },
        { rule: 'ghunnah' },
        { rule: 'madd_6' },
        { rule: null },
      ])
    ).toEqual(new Set(['madd', 'ghunnah']));
  });

  it('returns an empty set for a word with no annotated rules', () => {
    expect(ruleGroupsForWord([{ rule: null }, { rule: undefined }])).toEqual(
      new Set()
    );
  });
});
