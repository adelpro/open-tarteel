'use client';

import fullscreenExitSVG from '@svgs/fullscreen-exit.svg';
import { useAtom } from 'jotai';
import Image from 'next/image';
import React from 'react';

import { fullscreenAtom } from '@/jotai';

export default function ExitFullscreen() {
  const [isFullscreen, setIsFullscreen] = useAtom(fullscreenAtom);

  if (!isFullscreen) return;

  return (
    <div className="fixed right-0 top-0 z-50 m-2 rounded-full bg-background/80 p-4 transition-transform duration-300 ease-in-out hover:scale-125 hover:opacity-100">
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
