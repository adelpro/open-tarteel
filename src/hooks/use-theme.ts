'use client';

import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { type Palette, paletteAtom, type Theme, themeAtom } from '@/jotai/atom';

function prefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function resolveMode(mode: Theme): 'light' | 'dark' {
  if (mode === 'system') return prefersDark() ? 'dark' : 'light';
  return mode;
}

/** Apply the mode class and the palette attribute to <html>. */
export function applyTheme(mode: Theme, palette: Palette) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = palette;
  const dark = resolveMode(mode) === 'dark';
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', !dark);
}

export function useTheme() {
  const [mode, setMode] = useAtom(themeAtom);
  const [palette, setPalette] = useAtom(paletteAtom);

  useEffect(() => {
    applyTheme(mode, palette);
  }, [mode, palette]);

  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system', palette);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode, palette]);

  return {
    mode,
    setMode,
    palette,
    setPalette,
    resolvedMode: resolveMode(mode),
  };
}
