import { clientConfig } from '@/utils';

import type { SeoLocale } from './routes';

const appUrl = clientConfig.APP_URL.replace(/\/+$/, '');

export const SITE = {
  name: clientConfig.APP_NAME,
  url: appUrl,
  github: 'https://github.com/adelpro/open-tarteel',
  ogImage: '/opengraph-image.png',
  logo: '/images/icon-512.png',
} as const;

export const OG_LOCALES: Record<SeoLocale, string> = {
  ar: 'ar_AR',
  en: 'en_US',
  de: 'de_DE',
};
