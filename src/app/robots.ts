import { MetadataRoute } from 'next';

import { clientConfig, normalizeAppUrl } from '@/utils';

export default function robots(): MetadataRoute.Robots {
  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';

  if (
    process.env.SEO_NOINDEX === 'true' ||
    process.env.NEXT_PUBLIC_IS_PREVIEW === 'true'
  ) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

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
