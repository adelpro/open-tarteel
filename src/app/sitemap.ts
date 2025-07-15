import { MetadataRoute } from 'next';
import { useEffect, useState } from 'react';

import { Reciter } from '@/types';
import { clientConfig } from '@/utils';
import { fetchReciters } from '@/utils/api';
export default function Sitemap(): MetadataRoute.Sitemap {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  // Fetch reciters
  useEffect(() => {
    const loadReciters = async () => {
      try {
        const data = await fetchReciters();
        setReciters(data);
      } catch {}
    };
    loadReciters();
  }, []);

  const recitersMap = reciters.map((reciter) => ({
    url: `/${clientConfig.APP_URL}/reciter/${reciter.id}}`,
    lastModified: new Date(),
  }));
  return [
    // Home Page
    {
      url: clientConfig.APP_URL,
      lastModified: new Date(),
    },
    // About Page
    {
      url: clientConfig.APP_URL + '/about',
      lastModified: new Date(),
    },
    // Contact Page
    {
      url: clientConfig.APP_URL + '/contact',
      lastModified: new Date(),
    },
    // Privacy Page
    {
      url: clientConfig.APP_URL + '/privacy',
      lastModified: new Date(),
    },

    ...recitersMap,
  ];
}
