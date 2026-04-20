import './globals.css';

import { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { EnabledSourcesCookieSync } from '@/components/enabled-sources-cookie-sync';
import FullscreenController from '@/components/fullscreen-controller';
import HtmlWrapper from '@/components/html-wrapper';
import IntlProviderWrapper from '@/components/intl-provider-wrapper';
import { clientConfig } from '@/utils';

export const metadata: Metadata = {
  metadataBase: new URL(clientConfig.APP_URL),
  title: 'Open Tarteel — Quran Audio Player',
  description:
    'Listen to the Holy Quran recited by world-renowned reciters. Free, open-source Quran audio player with playlist support.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NuqsAdapter>
      <IntlProviderWrapper>
        <HtmlWrapper>
          <body
            className={`${tajawal.className} min-h-full bg-background antialiased`}
          >
            <main className="duration-350·relative·flex·min-h-dvh·w-full·flex-col·items-center·justify-center·bg-background·text-foreground·transition-colors">
              <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-[10%] -top-[15%] h-[520px] w-[520px] rounded-full bg-sky-500/[0.06] blur-[80px] dark:bg-sky-400/[0.07]" />
                <div className="absolute -right-[8%] top-[25%] h-[420px] w-[420px] rounded-full bg-indigo-500/[0.05] blur-[80px] dark:bg-indigo-400/[0.07]" />
                <div className="absolute bottom-[-10%] left-[35%] h-[340px] w-[340px] rounded-full bg-violet-500/[0.04] blur-[70px] dark:bg-violet-400/[0.06]" />
              </div>
              <EnabledSourcesCookieSync />
              <FullscreenController>{children}</FullscreenController>
            </main>
          </body>
        </HtmlWrapper>
      </IntlProviderWrapper>
    </NuqsAdapter>
  );
}
