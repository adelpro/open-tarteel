import { describe, expect, it } from 'vitest';

import {
  alternatesFor,
  isIndexable,
  localeFromPath,
  stripLocale,
  withLocale,
} from './routes';

describe('seo routes', () => {
  it('keeps Arabic at bare paths', () => {
    expect(withLocale('ar', '/about')).toBe('/about');
    expect(withLocale('ar', '/')).toBe('/');
  });

  it('prefixes English and German', () => {
    expect(withLocale('en', '/about')).toBe('/en/about');
    expect(withLocale('en', '/')).toBe('/en');
    expect(withLocale('de', '/reciter/itqan.dev-2')).toBe(
      '/de/reciter/itqan.dev-2'
    );
  });

  it('does not double-prefix', () => {
    expect(withLocale('en', '/en/about')).toBe('/en/about');
    expect(withLocale('de', '/de')).toBe('/de');
  });

  it('reads and strips the locale', () => {
    expect(localeFromPath('/en/about')).toBe('en');
    expect(localeFromPath('/de')).toBe('de');
    expect(localeFromPath('/about')).toBe('ar');
    expect(localeFromPath('/english')).toBe('ar');
    expect(stripLocale('/de/reciter/itqan.dev-2')).toBe(
      '/reciter/itqan.dev-2'
    );
    expect(stripLocale('/en')).toBe('/');
  });

  it('builds the three language twins and x-default', () => {
    expect(alternatesFor('/about')).toEqual({
      ar: '/about',
      en: '/en/about',
      de: '/de/about',
      'x-default': '/about',
    });
  });

  it('knows which pages may be indexed', () => {
    expect(isIndexable('/')).toBe(true);
    expect(isIndexable('/en/about')).toBe(true);
    expect(isIndexable('/reciter/itqan.dev-2')).toBe(true);
    expect(isIndexable('/de/settings')).toBe(false);
    expect(isIndexable('/offline')).toBe(false);
  });
});
