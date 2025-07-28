'use client';

import { useAtomValue } from 'jotai';

import ReciterPage from '@/app/reciter/[id]/reciter-page';
import UnderConstruction from '@/components/under-construction';
import { fullscreenAtom } from '@/jotai/atom';
import { cn } from '@/utils';

import Logo from './logo';

export default function Home() {
  const isFullscreen = useAtomValue(fullscreenAtom);
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center bg-background text-foreground',
        isFullscreen ? 'h-screen' : 'min-h-screen'
      )}
    >
      <Logo />
      <ReciterPage />
      <UnderConstruction />
    </div>
  );
}
