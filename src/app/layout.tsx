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
import ThemeSwitcher from '@/components/theme-switcher';
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
    <IntlProviderWrapper>
      <HtmlWrapper>
        <body className={`${tajawal.className} antialiased`}>
          <main className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-background text-foreground transition-colors duration-300">
            {/* Global background effects */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="bg-brand-CTA-blue-800/5 dark:bg-brand-CTA-blue-800/10 absolute -top-[20%] left-[10%] h-[500px] w-[500px] rounded-full mix-blend-multiply blur-3xl dark:mix-blend-screen" />
              <div className="absolute -right-[10%] top-[30%] h-[400px] w-[400px] rounded-full bg-indigo-500/5 mix-blend-multiply blur-3xl dark:bg-indigo-800/10 dark:mix-blend-screen" />
            </div>
            {isFullscreen ? <ExitFullscreen /> : <></>}
            {isFullscreen ? (
              <></>
            ) : (
              <div className="fixed right-4 top-4 z-50 flex items-center gap-3">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            )}
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
