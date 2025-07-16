import { RefObject, useEffect, useRef, useState } from 'react';

export function useKeyboardNavigation(itemCount: number): {
  focusedIndex: number | null;
  setFocusedIndex: (index: number | null) => void;
  reciterRefs: RefObject<(HTMLButtonElement | null)[]>;
  searchInputRef: RefObject<HTMLInputElement | null>;
} {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const reciterReferences = useRef<(HTMLButtonElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (itemCount === 0) return;

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          setFocusedIndex((previous) =>
            previous === null || previous === itemCount - 1 ? 0 : previous + 1
          );
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          setFocusedIndex((previous) =>
            previous === null || previous === 0 ? itemCount - 1 : previous - 1
          );
          break;
        }
        case 'Escape': {
          setFocusedIndex(null);
          searchInputRef.current?.focus();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemCount]);

  useEffect(() => {
    if (focusedIndex !== null) {
      reciterReferences.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
      reciterReferences.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    reciterRefs: reciterReferences,
    searchInputRef,
  };
}
