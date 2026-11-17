import { cn } from '@/utils';

import styles from './follow-along.module.css';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toArabicDigits = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);

export interface AyahMarkerProps {
  number: number;
  className?: string;
}

/**
 * Design 012 from quranpedia/ayah-markers. Rendered as the original SVG, so
 * the cream disc and its two tones survive, with a dark ayah number on top.
 * Decorative: the number is already in the text flow for screen readers.
 */
export function AyahMarker({ number, className }: AyahMarkerProps) {
  return (
    <span className={cn(styles.marker, className)} aria-hidden="true">
      <span className={styles.markerArt} />
      <span className={styles.markerNumber}>{toArabicDigits(number)}</span>
    </span>
  );
}
