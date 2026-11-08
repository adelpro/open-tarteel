import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Tajawal } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { EnabledSourcesCookieSync } from '@/components/enabled-sources-cookie-sync';
import FullscreenController from '@/components/fullscreen-controller';
import HtmlWrapper from '@/components/html-wrapper';
import IntlProviderWrapper from '@/components/intl-provider-wrapper';
import OfflineRedirect from '@/components/offline-redirect';
import PwaUpdater from '@/components/pwa-updater';
import StoragePersist from '@/components/storage-persist';
import type { Language } from '@/constants/language';
import { clientConfig, getDefaultLocale } from '@/utils';

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
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
  title: 'Open Tarteel — Quran Audio Player',
  description:
    'Listen to the Holy Quran recited by world-renowned reciters. Free, open-source Quran audio player with playlist support.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Open Tarteel — Quran Audio Player',
    description:
      'Listen to the Holy Quran recited by world-renowned reciters. Free and open-source.',
    type: 'website',
    siteName: 'Open Tarteel',
    images: ['/images/logo-og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Tarteel — Quran Audio Player',
    description:
      'Listen to the Holy Quran recited by world-renowned reciters. Free and open-source.',
    images: ['/images/logo-og.png'],
  },
};

const tajawal = Tajawal({
  weight: ['400', '700', '900'],
  subsets: ['arabic'],
  preload: true,
});

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: clientConfig.APP_NAME,
      url: clientConfig.APP_URL,
      description:
        'Listen to the Holy Quran recited by world-renowned reciters. Free and open-source.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      inLanguage: ['ar', 'en', 'de'],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'Organization',
      name: clientConfig.APP_NAME,
      url: clientConfig.APP_URL,
      logo: `${clientConfig.APP_URL}/images/192x192.png`,
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get('locale')?.value;
  const acceptLanguage = headerStore.get('accept-language');

  const resolvedLocale: Language =
    cookieLocale === 'ar' || cookieLocale === 'en' || cookieLocale === 'de'
      ? cookieLocale
      : getDefaultLocale(acceptLanguage);

  return (
    <NuqsAdapter>
      <IntlProviderWrapper initialLocale={resolvedLocale}>
        <HtmlWrapper>
          <body
            className={`${tajawal.className} min-h-full bg-background antialiased`}
          >
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg dark:focus:bg-gray-800 dark:focus:text-gray-100"
            >
              Skip to content / تخطَّ إلى المحتوى
            </a>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
            />
            <main
              id="main-content"
              className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-background text-foreground"
            >
              <div className="ambient-orbs pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-[10%] -top-[15%] h-[520px] w-[520px] rounded-full bg-sky-500/[0.06] blur-[80px] dark:bg-sky-400/[0.07]" />
                <div className="absolute -right-[8%] top-[25%] h-[420px] w-[420px] rounded-full bg-indigo-500/[0.05] blur-[80px] dark:bg-indigo-400/[0.07]" />
                <div className="absolute bottom-[-10%] left-[35%] h-[340px] w-[340px] rounded-full bg-violet-500/[0.04] blur-[70px] dark:bg-violet-400/[0.06]" />
              </div>
              <EnabledSourcesCookieSync />
              <StoragePersist />
              <OfflineRedirect />
              {process.env.NEXT_PUBLIC_IS_PREVIEW !== 'true' && <PwaUpdater />}
              <FullscreenController>{children}</FullscreenController>
            </main>
          </body>
        </HtmlWrapper>
      </IntlProviderWrapper>
    </NuqsAdapter>
  );
}
