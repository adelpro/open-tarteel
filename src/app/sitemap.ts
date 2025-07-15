// No 'use client' here!

import { MetadataRoute } from 'next';

import { clientConfig } from '@/utils';
import { getAllReciters } from '@/utils/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const reciters = await getAllReciters();

  const recitersMap = reciters.map((reciter) => ({
    url: `${clientConfig.APP_URL}/reciter/${reciter.id}`,
    lastModified: new Date(),
  }));

  return [
    {
      url: clientConfig.APP_URL,
      lastModified: new Date(),
    },
    {
      url: `${clientConfig.APP_URL}/about`,
      lastModified: new Date(),
    },
    {
      url: `${clientConfig.APP_URL}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${clientConfig.APP_URL}/privacy`,
      lastModified: new Date(),
    },
    ...recitersMap,
  ];
}
