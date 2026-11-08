import fullscreenExitSVG from '@svgs/fullscreen-exit.svg';
import { useSetAtom } from 'jotai';
import Image from 'next/image';
import React from 'react';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { fullscreenAtom } from '@/jotai/atom';
import { cn } from '@/utils';

export default function ExitFullscreen() {
  const setIsFullscreen = useSetAtom(fullscreenAtom);
  const isOnline = useNetworkStatus();
  return (
    <div
      className={cn(
        'fixed right-0 z-50 m-2 rounded-full bg-background p-4 transition-transform duration-300 ease-in-out hover:scale-125 hover:opacity-100',
        isOnline ? 'top-0' : 'top-16'
      )}
    >
      <Image
        src={fullscreenExitSVG}
        alt="Exit Fullscreen"
        width={32}
        height={32}
        className="cursor-pointer"
        onClick={() => {
          document.exitFullscreen();
          setIsFullscreen(false);
        }}
      />
    </div>
  );
}
