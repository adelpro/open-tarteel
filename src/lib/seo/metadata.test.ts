import { describe, expect, it } from 'vitest';

import { buildPageMetadata } from './metadata';

describe('buildPageMetadata', () => {
  const meta = buildPageMetadata({
    origin: 'https://tarteel.example',
    locale: 'en',
    path: '/about',
    title: 'About Open Tarteel',
    description: 'Open-source Quran audio player.',
  });

  it('uses the locale canonical', () => {
    expect(meta.alternates?.canonical).toBe(
      'https://tarteel.example/en/about'
    );
  });

  it('declares all language twins and x-default', () => {
    expect(meta.alternates?.languages).toMatchObject({
      ar: 'https://tarteel.example/about',
      en: 'https://tarteel.example/en/about',
      de: 'https://tarteel.example/de/about',
      'x-default': 'https://tarteel.example/about',
    });
  });

  it('sets a 1200x630 OG image', () => {
    expect(meta.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 1200, height: 630 }),
      ])
    );
  });

  it('sets the Open Graph locale and alternate locales', () => {
    expect(meta.openGraph?.locale).toBe('en_US');
    expect(meta.openGraph?.alternateLocale).toEqual(
      expect.arrayContaining(['ar_AR', 'de_DE'])
    );
  });

  it('can mark a page noindex', () => {
    const privateMeta = buildPageMetadata({
      origin: 'https://tarteel.example',
      locale: 'ar',
      path: '/settings',
      title: 'Settings',
      description: 'Settings',
      robots: { index: false, follow: false },
    });
    expect(privateMeta.robots).toEqual({ index: false, follow: false });
  });
});
