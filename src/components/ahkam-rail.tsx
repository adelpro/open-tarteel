'use client';

import { useEffect, useRef } from 'react';

import type { WordState } from '@/services/follow-along';
import { buildLineStates } from '@/services/follow-along';
import type { AyahAhkam } from '@/services/follow-along/ahkam';
import { TAJWEED_COLORS, TAJWEED_LABELS } from '@/services/quran-text/rules';
import { cn } from '@/utils';

export interface AhkamRailProps {
  /** Rules of the current ayah, in word order. Empty renders nothing. */
  rules: readonly AyahAhkam[];
  /** Stored word index being recited, or null before playback. */
  activeWord: number | null;
  locale?: 'ar' | 'en';
  className?: string;
}

const CHIP =
  'flex shrink-0 items-center gap-1 rounded-full border px-2 py-px text-[10px] font-medium transition-opacity duration-150';

const STATE_CLASS: Record<WordState | 'idle', string> = {
  current: 'border-border bg-surface-sunken text-ink opacity-100',
  spoken: 'border-transparent text-ink-muted opacity-45',
  upcoming: 'border-transparent text-ink-muted opacity-30',
  /** Nothing to track: the rules are listed, no word is being followed. */
  idle: 'border-transparent text-ink-muted opacity-75',
};

/**
 * The ahkam of the ayah being recited, one chip per word.
 *
 * A rail, not a timeline: a word's rule is known from the text, while where the
 * rule starts inside the word is not. Placing chips in word order and lighting
 * the one being recited shows what is happening without measuring how it is
 * performed. One row, scrolled to the active chip, so a long ayah cannot change
 * the panel's height.
 */
export function AhkamRail({
  rules,
  activeWord,
  locale = 'ar',
  className,
}: AhkamRailProps) {
  const activeRef = useRef<HTMLLIElement>(null);
  // A null word means "not following a word", which is the honest state before
  // playback and for an ayah whose provider timings fell back. Everything stays
  // legible instead of being dimmed as if it were all still ahead.
  const states = activeWord == null ? null : buildLineStates(rules, activeWord);

  useEffect(() => {
    // Optional call: jsdom and older browsers have no scrollIntoView.
    activeRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [activeWord]);

  if (rules.length === 0) return null;

  return (
    <ul
      className={cn(
        'flex w-full items-center gap-1 overflow-x-auto py-0.5',
        className
      )}
      aria-label={locale === 'ar' ? 'أحكام الآية' : 'Rules in this ayah'}
    >
      {rules.map((rule, index) => {
        const state = states?.[index] ?? 'idle';
        return (
          <li
            key={`${rule.storedIndex}-${rule.group}`}
            ref={state === 'current' ? activeRef : undefined}
            className={cn(CHIP, STATE_CLASS[state])}
            aria-current={state === 'current' ? 'true' : undefined}
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: TAJWEED_COLORS[rule.group] }}
              aria-hidden="true"
            />
            {TAJWEED_LABELS[rule.group][locale]}
          </li>
        );
      })}
    </ul>
  );
}
