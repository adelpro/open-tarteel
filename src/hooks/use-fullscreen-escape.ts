'use client';
import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { fullscreenAtom } from '@/jotai';

export function useFullscreenEscape() {
  const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };

    globalThis.window.addEventListener('keydown', onKey);
    return () => globalThis.window.removeEventListener('keydown', onKey);
  }, [setFullscreen]);

  return [isFullscreen, setFullscreen] as const;
}
