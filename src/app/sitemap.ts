import { MetadataRoute } from 'next';

import { RECITERS } from '@/constants';
import { clientConfig } from '@/utils';
export default function Sitemap(): MetadataRoute.Sitemap {
  const recitersMap = RECITERS.map((reciter) => ({
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
