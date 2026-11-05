import { MetadataRoute } from 'next';

import { clientConfig, normalizeAppUrl } from '@/utils';

export default function robots(): MetadataRoute.Robots {
  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/private/'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
