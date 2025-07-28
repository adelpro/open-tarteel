'use client';
import './globals.css';

import { useAtom, useAtomValue } from 'jotai';
import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { use, useEffect } from 'react';

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
  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen, setIsFullscreen]);
  return (
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
  );
}
