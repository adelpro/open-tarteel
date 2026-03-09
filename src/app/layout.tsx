'use client';
import './globals.css';

import { useAtom } from 'jotai';
import { Tajawal } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useEffect } from 'react';

import { EnabledSourcesCookieSync } from '@/components/enabled-sources-cookie-sync';
import ExitFullscreen from '@/components/exit-fullscreen';
import Footer from '@/components/footer';
import HtmlWrapper from '@/components/html-wrapper';
import IntlProviderWrapper from '@/components/intl-provider-wrapper';
import LanguageSwitcher from '@/components/language-switcher';
import SettingsLink from '@/components/settings-link';
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
    <NuqsAdapter>
      <IntlProviderWrapper>
        <HtmlWrapper>
          <body
            className={`${tajawal.className} min-h-full bg-background antialiased`}
          >
            <main className="duration-350·relative·flex·min-h-dvh·w-full·flex-col·items-center·justify-center·bg-background·text-foreground·transition-colors">
              {/* Global background effects — fixed, pointer-events-none, pure CSS */}
              <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                {/* Top-left: sky accent orb */}
                <div className="absolute -left-[10%] -top-[15%] h-[520px] w-[520px] rounded-full bg-sky-500/[0.06] blur-[80px] dark:bg-sky-400/[0.07]" />
                {/* Center-right: indigo orb */}
                <div className="absolute -right-[8%] top-[25%] h-[420px] w-[420px] rounded-full bg-indigo-500/[0.05] blur-[80px] dark:bg-indigo-400/[0.07]" />
                {/* Bottom: subtle violet depth */}
                <div className="absolute bottom-[-10%] left-[35%] h-[340px] w-[340px] rounded-full bg-violet-500/[0.04] blur-[70px] dark:bg-violet-400/[0.06]" />
              </div>
              <EnabledSourcesCookieSync />
              {isFullscreen ? <ExitFullscreen /> : <></>}
              {isFullscreen ? <></> : <SettingsLink />}
              {isFullscreen ? (
                <></>
              ) : (
                <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
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
    </NuqsAdapter>
  );
}
