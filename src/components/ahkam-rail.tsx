'use client';

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

const MARK =
  'h-2.5 min-w-0 flex-1 origin-bottom rounded-full transition-[transform,opacity] duration-180 ease-[cubic-bezier(0.23,1,0.32,1)]';

/**
 * Height is a scale on a fixed box, so nothing reflows when the active rule
 * moves along the row.
 */
const STATE_CLASS: Record<WordState | 'idle', string> = {
  current: 'scale-y-100 opacity-100',
  spoken: 'scale-y-40 opacity-45',
  upcoming: 'scale-y-40 opacity-25',
  /** Nothing to follow: the rules are listed, none is emphasised. */
  idle: 'scale-y-60 opacity-75',
};

/**
 * The ahkam of the ayah, one mark per word that carries one, in word order.
 *
 * A strip rather than a row of labels: the same rule repeats across a line, so
 * names under every word said nothing the colours did not, and the chips read
 * as a widget instead of a layer of the text. The name is still there for a
 * screen reader, and the colour key below the line maps colour to rule.
 *
 * A word's rule is known from the text; where the rule starts inside the word
 * is not, so marks are word-granularity and never timed.
 */
export function AhkamRail({
  rules,
  activeWord,
  locale = 'ar',
  className,
}: AhkamRailProps) {
  // A null word means "not following a word", which is the honest state before
  // playback and for an ayah whose provider timings fell back.
  const states = activeWord == null ? null : buildLineStates(rules, activeWord);

  if (rules.length === 0) return null;

  return (
    <ol
      className={cn('flex w-full items-end gap-1 py-px', className)}
      aria-label={locale === 'ar' ? 'أحكام الآية' : 'Rules in this ayah'}
    >
      {rules.map((rule, index) => {
        const state = states?.[index] ?? 'idle';
        return (
          <li
            key={`${rule.storedIndex}-${rule.group}`}
            className={cn(MARK, STATE_CLASS[state])}
            style={{ backgroundColor: TAJWEED_COLORS[rule.group] }}
            aria-current={state === 'current' ? 'true' : undefined}
          >
            <span className="sr-only">
              {TAJWEED_LABELS[rule.group][locale]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
