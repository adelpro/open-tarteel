import { MetadataRoute } from 'next';

import { clientConfig } from '@/utils';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: `${clientConfig.APP_URL}/sitemap.xml`,
  };
}
