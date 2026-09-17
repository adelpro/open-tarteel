import { describe, expect, it } from 'vitest';

import { getDefaultLocale } from './get-default-locale';

describe('getDefaultLocale', () => {
  it('returns "ar" when input starts with "ar"', () => {
    expect(getDefaultLocale('ar')).toBe('ar');
    expect(getDefaultLocale('ar-SA')).toBe('ar');
    expect(getDefaultLocale('ar-EG')).toBe('ar');
    expect(getDefaultLocale('AR-AE')).toBe('ar');
  });

  it('returns "ar" when Arabic is listed in Accept-Language header', () => {
    expect(getDefaultLocale('ar,en-US;q=0.9,en;q=0.8')).toBe('ar');
    expect(getDefaultLocale('ar-SA,ar;q=0.9,en-US;q=0.8')).toBe('ar');
  });

  it('returns "en" when input is English', () => {
    expect(getDefaultLocale('en')).toBe('en');
    expect(getDefaultLocale('en-US')).toBe('en');
    expect(getDefaultLocale('en-GB')).toBe('en');
  });

  it('returns "en" when input is any non-Arabic language', () => {
    expect(getDefaultLocale('fr')).toBe('en');
    expect(getDefaultLocale('fr-FR')).toBe('en');
    expect(getDefaultLocale('tr')).toBe('en');
    expect(getDefaultLocale('tr-TR')).toBe('en');
    expect(getDefaultLocale('de')).toBe('en');
    expect(getDefaultLocale('es')).toBe('en');
    expect(getDefaultLocale('ur')).toBe('en');
    expect(getDefaultLocale('id')).toBe('en');
  });

  it('returns "en" when input is null, undefined, or empty', () => {
    expect(getDefaultLocale(null)).toBe('en');
    expect(getDefaultLocale(undefined)).toBe('en');
    expect(getDefaultLocale('')).toBe('en');
  });
});
