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

  const hasOrigin = /^https?:\/\//i.test(appUrl);

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/private/'],
    },
    // A relative `Sitemap:` is ignored by crawlers, and an empty `Host:` is
    // invalid. Only emit both when the configured origin is absolute.
    ...(hasOrigin
      ? { sitemap: `${appUrl}/sitemap.xml`, host: appUrl }
      : {}),
  };
}
