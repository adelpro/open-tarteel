'use client';

import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { fullscreenAtom } from '@/jotai';

export default function SyncFullscreen() {
  const setIsFullscreen = useSetAtom(fullscreenAtom);

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

  return null;
}
