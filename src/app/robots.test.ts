import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (environment: Record<string, string>) => {
  for (const [key, value] of Object.entries(environment)) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
  const { default: robots } = await import('./robots');
  return robots();
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('robots', () => {
  it('names an absolute sitemap and host in production', async () => {
    const result = await load({
      NEXT_PUBLIC_APP_URL: 'https://tarteel.example',
      NEXT_PUBLIC_IS_PREVIEW: '',
      SEO_NOINDEX: '',
    });

    expect(result.sitemap).toBe('https://tarteel.example/sitemap.xml');
    expect(result.host).toBe('https://tarteel.example');
    expect(result.rules).toMatchObject({ allow: '/' });
  });

  it('blocks every path on a deploy preview', async () => {
    const result = await load({
      NEXT_PUBLIC_APP_URL: 'https://tarteel.example',
      NEXT_PUBLIC_IS_PREVIEW: 'true',
    });

    expect(result.rules).toEqual({ userAgent: '*', disallow: '/' });
    expect(result.sitemap).toBeUndefined();
  });

  it('blocks every path when SEO_NOINDEX is true', async () => {
    const result = await load({
      NEXT_PUBLIC_APP_URL: 'https://tarteel.example',
      SEO_NOINDEX: 'true',
    });

    expect(result.rules).toEqual({ userAgent: '*', disallow: '/' });
  });
});
