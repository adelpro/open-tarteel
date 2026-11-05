// No 'use client' here!

import { MetadataRoute } from 'next';

import type { Reciter } from '@/types';
import { clientConfig, normalizeAppUrl } from '@/utils';
import { getAllReciters } from '@/utils/api';

export const revalidate = 86400;

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
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${appUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${appUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${appUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...recitersMap,
  ];
}
