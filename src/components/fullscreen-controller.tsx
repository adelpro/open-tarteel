'use client';

import { useAtom } from 'jotai';
import { useEffect } from 'react';

import ExitFullscreen from '@/components/exit-fullscreen';
import Footer from '@/components/footer';
import NetworkStatusIndicator from '@/components/network-status-indicator';
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
        <div className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-xl px-3 pt-[max(12px,env(safe-area-inset-top))]">
          <NetworkStatusIndicator />
        </div>
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex w-full flex-grow items-center justify-center">
        {children}
      </div>
      <Footer />
    </>
  );
}
