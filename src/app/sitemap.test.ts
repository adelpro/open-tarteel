import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/api', () => ({
  getAllReciters: vi.fn(async () => [
    {
      id: 'itqan.dev-2',
      name: 'Badr',
      source: 'itqan.dev',
      moshaf: { id: '11', playlist: [] },
    },
  ]),
}));

let sitemap: typeof import('./sitemap').default;

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://tarteel.example');
  vi.resetModules();
  sitemap = (await import('./sitemap')).default;
});

describe('sitemap', () => {
  it('lists the home, about, contact and privacy in three languages', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        'https://tarteel.example/',
        'https://tarteel.example/en',
        'https://tarteel.example/de',
        'https://tarteel.example/about',
        'https://tarteel.example/en/about',
        'https://tarteel.example/de/about',
      ])
    );
  });

  it('never lists settings or offline', async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(
      urls.some(
        (url) => url.includes('/settings') || url.includes('/offline')
      )
    ).toBe(false);
  });

  it('declares the language twins on every entry', async () => {
    const entries = await sitemap();
    const about = entries.find(
      (entry) => entry.url === 'https://tarteel.example/about'
    );

    expect(about?.alternates?.languages).toMatchObject({
      ar: 'https://tarteel.example/about',
      en: 'https://tarteel.example/en/about',
      de: 'https://tarteel.example/de/about',
      'x-default': 'https://tarteel.example/about',
    });
  });
});
