'use client';

import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';

import { focusedIndexAtom, recitersCountAtom } from '@/jotai/atoms';

export function useKeyboardNavigation() {
  const [focusedIndex, setFocusedIndex] = useAtom(focusedIndexAtom);
  const [recitersCount, setRecitersCount] = useAtom(recitersCountAtom);

  const reciterReferences = useRef<(HTMLAnchorElement | null)[]>([]);
  const recitersCountRef = useRef<number>(recitersCount);
  recitersCountRef.current = recitersCount;

  const resetFocusedIndex = useCallback(() => {
    setFocusedIndex(null);
  }, [setFocusedIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const count = recitersCountRef.current;
      if (count === 0) return;
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          setFocusedIndex((current) =>
            current === null || current === count - 1 ? 0 : current + 1
          );
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          setFocusedIndex((current) =>
            current === null || current === 0 ? count - 1 : current - 1
          );
          break;
        }
        case 'Escape': {
          setFocusedIndex(null);
          document.getElementById('search-input')?.focus();
          break;
        }
      }
    };

    globalThis.window.addEventListener('keydown', handleKeyDown);
    return () =>
      globalThis.window.removeEventListener('keydown', handleKeyDown);
  }, [setFocusedIndex]);

  useEffect(() => {
    if (focusedIndex === null) return;
    reciterReferences.current[focusedIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
    reciterReferences.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    resetFocusedIndex,
    reciterRefs: reciterReferences,
    setRecitersCount,
  };
}
