'use client';

import { useAtom, useAtomValue } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import ExitFullscreen from '@/components/exit-fullscreen';
import Footer from '@/components/footer';
import LanguageSwitcher from '@/components/language-switcher';
import ReciterSelector from '@/components/reciter-selector';
import UnderConstruction from '@/components/under-construction';
import { useReciterFromUrl } from '@/hooks/use-reciter-from-url';
import { fullscreenAtom, selectedReciterAtom } from '@/jotai/atom';

import Logo from '../../components/logo';

export default function Home() {
  // Initialize selectedReciter from URL parameters
  useReciterFromUrl();

  const selectedReciter = useAtomValue(selectedReciterAtom);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFullscreen, setIsFullscreen] = useAtom(fullscreenAtom);
  useEffect(() => {
    if (!selectedReciter) return;
    const currentPath = `${pathname}?${searchParams.toString()}`;
    const targetPath = `/reciter/${selectedReciter.id}?moshafId=${selectedReciter.moshaf.id}`;

    if (currentPath !== targetPath) {
      router.push(targetPath);
    }
  }, [selectedReciter, pathname, searchParams, router]);

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
    <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
      {' '}
      {isFullscreen ? <ExitFullscreen /> : <></>}
      {isFullscreen ? <></> : <LanguageSwitcher />}
      <Logo />
      <ReciterSelector />
      <UnderConstruction />
      {isFullscreen ? <></> : <Footer />}
    </div>
  );
}
