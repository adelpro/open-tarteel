// No 'use client' here!

import { MetadataRoute } from 'next';

import type { Reciter } from '@/types';
import { clientConfig, normalizeAppUrl } from '@/utils';
import { getAllReciters } from '@/utils/api';

export const revalidate = 86400;

// Content timestamps are not exposed by the upstream catalogs. Bump this when
// site content changes instead of claiming every URL changed on every crawl.
const CONTENT_LAST_MODIFIED = new Date('2026-11-07T00:00:00.000Z');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';

  let reciters: Reciter[] = [];
  try {
    reciters = await getAllReciters();
  } catch {
    // A sitemap should never break the build because an upstream API is down.
    reciters = [];
  }

  // A reciter can have multiple moshaf entries; only emit one URL per id.
  const reciterIds = [...new Set(reciters.map((reciter) => reciter.id))];

  const recitersMap = reciterIds.map((id) => ({
    url: `${appUrl}/reciter/${id}`,
    lastModified: CONTENT_LAST_MODIFIED,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: appUrl,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${appUrl}/about`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${appUrl}/contact`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${appUrl}/privacy`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...recitersMap,
  ];
}
