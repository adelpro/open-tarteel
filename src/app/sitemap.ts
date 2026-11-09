// No 'use client' here!

import type { MetadataRoute } from 'next';

import {
  alternatesFor,
  LOCALES,
  ROUTES,
  type SeoLocale,
  withLocale,
} from '@/lib/seo/routes';
import type { Reciter } from '@/types';
import { clientConfig, normalizeAppUrl } from '@/utils';
import { getAllReciters } from '@/utils/api';

export const revalidate = 86400;

// Content timestamps are not exposed by the upstream catalogs. Bump this when
// site content changes instead of claiming every URL changed on every crawl.
const CONTENT_LAST_MODIFIED = new Date('2026-11-09T00:00:00.000Z');

const absolute = (origin: string, path: string): string =>
  `${origin}${path === '/' ? '/' : path}`;

const languagesFor = (
  origin: string,
  path: string
): Record<string, string> => {
  const alternates = alternatesFor(path);
  return {
    ar: absolute(origin, alternates.ar),
    en: absolute(origin, alternates.en),
    de: absolute(origin, alternates.de),
    'x-default': absolute(origin, alternates['x-default']),
  };
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';

  let reciters: Reciter[] = [];
  try {
    reciters = await getAllReciters();
  } catch {
    // A sitemap should never break the build because an upstream API is down.
    reciters = [];
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const route of ROUTES) {
    if (!route.index || !route.sitemap || route.dynamic) continue;
    for (const locale of LOCALES as readonly SeoLocale[]) {
      entries.push({
        url: absolute(appUrl, withLocale(locale, route.path)),
        lastModified: CONTENT_LAST_MODIFIED,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: languagesFor(appUrl, route.path),
        },
      });
    }
  }

  const reciterRoute = ROUTES.find((route) => route.name === 'reciter');
  const reciterIds = [...new Set(reciters.map((reciter) => reciter.id))];

  for (const id of reciterIds) {
    const path = `/reciter/${id}`;
    for (const locale of LOCALES as readonly SeoLocale[]) {
      entries.push({
        url: absolute(appUrl, withLocale(locale, path)),
        lastModified: CONTENT_LAST_MODIFIED,
        changeFrequency: reciterRoute?.changeFrequency ?? 'weekly',
        priority: reciterRoute?.priority ?? 0.7,
        alternates: {
          languages: languagesFor(appUrl, path),
        },
      });
    }
  }

  return entries;
}
