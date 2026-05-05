'use client';

import { useAtom } from 'jotai';
import { useEffect } from 'react';

import ExitFullscreen from '@/components/exit-fullscreen';
import Footer from '@/components/footer';
import LanguageSwitcher from '@/components/language-switcher';
import SettingsLink from '@/components/settings-link';
import ThemeSwitcher from '@/components/theme-switcher';
import { fullscreenAtom } from '@/jotai/atom';

export default function FullscreenController({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isFullscreen, setIsFullscreen] = useAtom(fullscreenAtom);

  useEffect(() => {
    function onFullscreenChange() {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [setIsFullscreen]);

  if (isFullscreen) {
    return (
      <>
        <ExitFullscreen />
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      <SettingsLink />
      <div
        className="fixed right-4 top-4 z-50 flex items-center gap-2"
        style={{ direction: 'ltr' }}
      >
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <div className="flex w-full flex-grow items-center justify-center">
        {children}
      </div>
      <Footer />
    </>
  );
}
