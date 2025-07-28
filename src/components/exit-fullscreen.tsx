import fullscreenExitSVG from '@svgs/fullscreen-exit.svg';
import { useSetAtom } from 'jotai';
import Image from 'next/image';
import React from 'react';

import { fullscreenAtom } from '@/jotai/atom';

export default function ExitFullscreen() {
  const setIsFullscreen = useSetAtom(fullscreenAtom);
  return (
    <div className="bg-background/80 fixed right-0 top-0 z-50 m-2 rounded-full p-4 transition-transform duration-300 ease-in-out hover:scale-125 hover:opacity-100">
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
