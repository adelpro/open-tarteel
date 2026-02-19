'use client';
import './globals.css';

import { useAtom } from 'jotai';
import { Tajawal } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useEffect } from 'react';

import ExitFullscreen from '@/components/exit-fullscreen';
import Footer from '@/components/footer';
import HtmlWrapper from '@/components/html-wrapper';
import IntlProviderWrapper from '@/components/intl-provider-wrapper';
import LanguageSwitcher from '@/components/language-switcher';
import { fullscreenAtom } from '@/jotai/atom';
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
  const [isFullscreen, setIsFullscreen] = useAtom(fullscreenAtom);

  // Sync atom with actual fullscreen state (handles ESC key, user exit)
  useEffect(() => {
    function onFullscreenChange() {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [setIsFullscreen]);

  return (
    <NuqsAdapter>
      <IntlProviderWrapper>
        <HtmlWrapper>
          <body className={`${tajawal.className} antialiased`}>
            <main className="relative flex min-h-dvh w-full flex-col items-center justify-center text-foreground">
              {isFullscreen ? <ExitFullscreen /> : <></>}
              {isFullscreen ? <></> : <LanguageSwitcher />}
              <div className="flex w-full flex-grow items-center justify-center">
                {children}
              </div>
              {isFullscreen ? <></> : <Footer />}
            </main>
          </body>
        </HtmlWrapper>
      </IntlProviderWrapper>
    </NuqsAdapter>
  );
}
