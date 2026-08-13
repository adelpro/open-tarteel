import { describe, expect, it } from 'vitest';

import { getAyahEditionForReciter } from './reciter-mapping';

describe('getAyahEditionForReciter', () => {
  it('returns null for empty input', () => {
    expect(getAyahEditionForReciter('')).toBeNull();
    expect(getAyahEditionForReciter('   ')).toBeNull();
  });

  it('matches an exact normalized name', () => {
    expect(getAyahEditionForReciter('مشاري راشد العفاسي')?.identifier).toBe(
      'ar.alafasy'
    );
  });

  it('matches despite tashkeel / alef variations', () => {
    expect(
      getAyahEditionForReciter('عَبْدُ البَاسِط عبد الصمد')?.identifier
    ).toBe('ar.abdulbasitmurattal');
  });

  it('matches a name with a title prefix', () => {
    expect(
      getAyahEditionForReciter('الشيخ مشاري راشد العفاسي')?.identifier
    ).toBe('ar.alafasy');
  });

  it('fuzzy-matches a close name variation', () => {
    expect(getAyahEditionForReciter('مشاري العفاسي')?.identifier).toBe(
      'ar.alafasy'
    );
  });

  it('matches the mujawwad variants distinctly', () => {
    expect(
      getAyahEditionForReciter('محمد صديق المنشاوي (مجود)')?.identifier
    ).toBe('ar.minshawimujawwad');
  });

  it('returns null for an unknown reciter', () => {
    expect(getAyahEditionForReciter('فارس عباد')).toBeNull();
  });
});
