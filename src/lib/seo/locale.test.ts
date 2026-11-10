import { describe, expect, it } from 'vitest';

import { resolveLocale } from './locale';

describe('resolveLocale', () => {
  it('trusts the middleware header first', () => {
    expect(resolveLocale('de', 'en-US', 'ar')).toBe('de');
  });

  it('falls back to the cookie, then the browser', () => {
    expect(resolveLocale(null, 'en-US', 'de')).toBe('de');
    expect(resolveLocale(null, 'en-US', null)).toBe('en');
    expect(resolveLocale(null, 'fr-FR', null)).toBe('ar');
  });

  it('ignores unsupported values', () => {
    expect(resolveLocale('fr', 'fr-FR', 'it')).toBe('ar');
  });
});
