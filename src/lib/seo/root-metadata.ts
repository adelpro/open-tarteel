import type { Metadata } from 'next';

import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';
import { clientConfig } from '@/utils';

import { type SeoLocale, withLocale } from './routes';
import { SITE } from './site';

const COPY = { ar, en, de } as const;

/**
 * Root metadata for one locale. The locale comes from the route group, not the
 * request, so the whole document can be prerendered.
 */
export const rootMetadata = (locale: SeoLocale): Metadata => {
  const copy = COPY[locale];
  const title = `${copy.appName} — Open Tarteel`;

  return {
    metadataBase: new URL(clientConfig.APP_URL),
    applicationName: clientConfig.APP_NAME,
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: clientConfig.APP_NAME,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: '/images/apple-touch-icon.png',
    },
    title,
    description: copy.appDescription,
    alternates: { canonical: withLocale(locale, '/') },
    openGraph: {
      title,
      description: copy.appDescription,
      type: 'website',
      siteName: 'Open Tarteel',
      images: ['/images/logo-og.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: copy.appDescription,
      images: ['/images/logo-og.png'],
    },
    verification: SITE.verification ? { google: SITE.verification } : undefined,
  };
};
