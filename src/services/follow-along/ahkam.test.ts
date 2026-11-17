import { describe, expect, it } from 'vitest';

import { AHKAM_GROUPS } from '@/services/quran-text/rules';
import type { AyahData, TajweedRule } from '@/services/quran-text/types';

import { ayahAhkam } from './ahkam';

/** Build an ayah from text and rules, counting words the way the build does. */
const ayah = (
  text: string,
  rules: TajweedRule[] = [],
  basmala = 0
): AyahData => ({
  t: text,
  w: text.split(' ').length,
  b: basmala,
  r: rules,
});

/** Cover `needle` with `rule`, keeping the indices honest without hand-counting. */
const ruleOn = (text: string, needle: string, rule: string): TajweedRule => {
  const start = text.indexOf(needle);
  if (start < 0) throw new Error(`fixture is missing ${needle}`);
  return [rule, start, start + needle.length];
};

describe('AHKAM_GROUPS', () => {
  it('lists only sound rules', () => {
    expect(AHKAM_GROUPS).toEqual([
      'madd',
      'ghunnah',
      'qalqalah',
      'idgham',
      'ikhfa',
      'iqlab',
    ]);
    expect(AHKAM_GROUPS).not.toContain('wasl');
    expect(AHKAM_GROUPS).not.toContain('shams');
    expect(AHKAM_GROUPS).not.toContain('silent');
  });
});

describe('ayahAhkam', () => {
  it('returns nothing for an ayah with no annotations', () => {
    expect(ayahAhkam(ayah('بِسْمِ ٱللَّهِ'))).toEqual([]);
  });

  it('maps a rule to the word that holds it', () => {
    const text = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ';
    const ahkam = ayahAhkam(ayah(text, [ruleOn(text, 'أَحَدٌ', 'qalqalah')]));

    expect(ahkam).toEqual([{ storedIndex: 4, group: 'qalqalah' }]);
  });

  it('keeps word order', () => {
    const text = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ';
    const ahkam = ayahAhkam(
      ayah(text, [
        ruleOn(text, 'أَحَدٌ', 'qalqalah'),
        ruleOn(text, 'قُلْ', 'ghunnah'),
      ])
    );

    expect(ahkam.map((entry) => entry.storedIndex)).toEqual([1, 4]);
  });

  it('drops rules that are not about the voice', () => {
    const text = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ';
    const ahkam = ayahAhkam(
      ayah(text, [
        ruleOn(text, 'هُوَ', 'hamzat_wasl'),
        ruleOn(text, 'ٱللَّهُ', 'lam_shamsiyyah'),
        ruleOn(text, 'أَحَدٌ', 'silent'),
      ])
    );

    expect(ahkam).toEqual([]);
  });

  it('gives one entry per word, taking the rule over the most characters', () => {
    const text = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ';
    const ahkam = ayahAhkam(
      ayah(text, [
        ruleOn(text, 'أَحَ', 'ghunnah'),
        ruleOn(text, 'دٌ', 'madd_2'),
        ruleOn(text, 'قُلْ', 'madd_6'),
      ])
    );

    expect(ahkam).toEqual([
      { storedIndex: 1, group: 'madd' },
      { storedIndex: 4, group: 'ghunnah' },
    ]);
  });

  it('breaks a tie by the declared group order', () => {
    const text = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ';
    const ahkam = ayahAhkam(
      ayah(text, [
        ruleOn(text, 'أَ', 'qalqalah'),
        ruleOn(text, 'دٌ', 'ghunnah'),
      ])
    );

    // One character each: ghunnah is declared before qalqalah.
    expect(ahkam).toEqual([{ storedIndex: 4, group: 'ghunnah' }]);
  });

  it('skips the basmala stored inside ayah 1', () => {
    const text = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ';
    const ahkam = ayahAhkam(
      ayah(text, [ruleOn(text, 'ٱلرَّحِيمِ', 'madd_2')], 4)
    );

    // The only annotated word is a basmala word, so nothing is left.
    expect(ahkam).toEqual([]);
  });

  it('keeps words after the basmala', () => {
    const text = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ';
    const ahkam = ayahAhkam(ayah(text, [ruleOn(text, 'قُلْ', 'madd_2')], 4));

    expect(ahkam).toEqual([{ storedIndex: 5, group: 'madd' }]);
  });
});
