'use client';

import { useLayoutEffect, useRef } from 'react';

import type { WordState } from '@/services/follow-along';
import { ruleGroup, TAJWEED_COLORS } from '@/services/quran-text/rules';
import { cn } from '@/utils';

import { AyahMarker } from './ayah-marker';
import styles from './follow-along.module.css';

export interface QuranLineChar {
  ch: string;
  /** Rule id from quran-tajweed; unmapped values render plain. */
  rule?: string | null;
}

export interface QuranLineWord {
  id: string | number;
  chars: QuranLineChar[];
  state?: WordState;
  /** When set, the word renders as the ayah marker for this number. */
  markerNumber?: number;
}

export interface QuranLineProps {
  words: QuranLineWord[];
  maxFontSize?: number;
  minFontSize?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * One measure, one scale. Measuring at the maximum size and shrinking once by
 * the ratio is two reflows, not the 15 to 30 of a stepping loop, and the line
 * animates every time it changes.
 */
export function fitFontSize(
  contentWidth: number,
  availableWidth: number,
  maxFontSize: number,
  minFontSize: number
): number {
  if (contentWidth <= 0 || availableWidth <= 0) return maxFontSize;
  if (contentWidth <= availableWidth) return maxFontSize;
  const scaled = (maxFontSize * availableWidth) / contentWidth;
  return Math.max(minFontSize, Math.floor(scaled * 2) / 2);
}

/**
 * One printed line: fills the width, shrinks to fit, never wraps. The caller
 * decides each word's state and supplies per-character rules; the component
 * knows nothing about audio, timings or providers.
 */
export function QuranLine({
  words,
  maxFontSize = 21,
  minFontSize = 14,
  className,
  ariaLabel,
}: QuranLineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const apply = () => {
      element.style.fontSize = `${maxFontSize}px`;
      const size = fitFontSize(
        element.scrollWidth,
        element.clientWidth,
        maxFontSize,
        minFontSize
      );
      element.style.fontSize = `${size}px`;
    };

    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(apply);
    observer.observe(element);
    return () => observer.disconnect();
  }, [words, maxFontSize, minFontSize]);

  return (
    <div
      ref={ref}
      dir="rtl"
      lang="ar"
      className={cn(styles.line, className)}
      aria-label={ariaLabel}
    >
      {words.map((word) => (
        <span
          key={word.id}
          className={styles.word}
          data-state={word.state ?? 'upcoming'}
          data-marker={word.markerNumber != null ? 'true' : undefined}
          aria-current={word.state === 'current' ? 'true' : undefined}
        >
          {word.markerNumber != null ? (
            <AyahMarker number={word.markerNumber} />
          ) : (
            word.chars.map((char, index) => {
              const group = ruleGroup(char.rule);
              return (
                <span
                  key={index}
                  style={group ? { color: TAJWEED_COLORS[group] } : undefined}
                >
                  {char.ch}
                </span>
              );
            })
          )}
        </span>
      ))}
    </div>
  );
}
