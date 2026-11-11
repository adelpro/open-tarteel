// No 'use client' here!

import type { MetadataRoute } from 'next';

import { mergedReciters } from '@/data/merged-reciters';
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
  `${origin}${path === '/' ? '' : path}`;

const languagesFor = (origin: string, path: string): Record<string, string> => {
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
  let reciterIds = [...new Set(reciters.map((reciter) => reciter.id))];

  if (reciterIds.length === 0) {
    // Keep the last known catalogue URLs when an upstream provider is down.
    const fallback = new Set<string>();
    for (const reciter of mergedReciters) {
      for (const entries of Object.values(reciter.providers)) {
        if (!Array.isArray(entries)) continue;
        for (const entry of entries as Array<{ id?: unknown }>) {
          if (typeof entry?.id === 'string') fallback.add(entry.id);
        }
      }
    }
    reciterIds = [...fallback];
  }

  // Reciter pages are Arabic documents. The English and German URLs exist as
  // canonicalised twins, so they are not listed and carry no hreflang pair.
  for (const id of reciterIds) {
    const path = `/reciter/${id}`;
    entries.push({
      url: absolute(appUrl, withLocale('ar', path)),
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: reciterRoute?.changeFrequency ?? 'weekly',
      priority: reciterRoute?.priority ?? 0.7,
    });
  }

  return entries;
}
