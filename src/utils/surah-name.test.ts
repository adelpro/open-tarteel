import { describe, expect, it } from 'vitest';

import type { Surah } from '@/types/surah';

import { getSurahDisplayName } from './surah-name';

const fatiha: Surah = {
  id: 1,
  name: 'سُورَةُ ٱلْفَاتِحَةِ',
  englishName: 'Al-Fatihah',
  germanName: 'Die Eröffnung',
  revelationType: 'Meccan',
  ayahCount: 7,
};

describe('getSurahDisplayName', () => {
  it('selects the German title for the de locale', () => {
    expect(getSurahDisplayName(fatiha, 'de')).toBe('Die Eröffnung');
  });

  it('selects the English title for the en locale', () => {
    expect(getSurahDisplayName(fatiha, 'en')).toBe('Al-Fatihah');
  });

  it('falls back to tashkeel-stripped Arabic otherwise', () => {
    expect(getSurahDisplayName(fatiha, 'ar')).toBe('سورة الفاتحة');
    expect(getSurahDisplayName(fatiha, 'fr')).toBe('سورة الفاتحة');
  });
});
