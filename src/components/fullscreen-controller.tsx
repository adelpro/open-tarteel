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

  return (
    <>
      {isFullscreen ? <ExitFullscreen /> : null}
      {isFullscreen ? null : <SettingsLink />}
      {isFullscreen ? null : (
        <div
          className="fixed top-4 z-50 flex items-center gap-2 p-1"
          style={{ right: '1rem', left: 'auto', direction: 'ltr' }}
        >
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      )}
      <div className="flex w-full flex-grow items-center justify-center">
        {children}
      </div>
      {isFullscreen ? null : <Footer />}
    </>
  );
}
