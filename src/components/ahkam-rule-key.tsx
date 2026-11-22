'use client';

import {
  AHKAM_GROUPS,
  TAJWEED_COLORS,
  TAJWEED_LABELS,
  type TajweedGroup,
} from '@/services/quran-text/rules';
import { cn } from '@/utils';

export interface AhkamRuleKeyProps {
  /** Rule groups on the word currently being recited. */
  activeGroups: Set<TajweedGroup>;
  locale?: 'ar' | 'en';
}

/**
 * A quiet, typographic key for tajweed colours: label plus underline, no chip.
 * Several rules can be active on one word, so any number of entries may be
 * emphasised at once.
 */
export function AhkamRuleKey({
  activeGroups,
  locale = 'ar',
}: AhkamRuleKeyProps) {
  return (
    <ul
      aria-label={locale === 'ar' ? 'أحكام التجويد' : 'Tajweed rules'}
      className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
    >
      {AHKAM_GROUPS.map((group) => {
        const active = activeGroups.has(group);
        return (
          <li
            key={group}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'pb-0.5 text-xs leading-5 transition-[color,border-width] duration-180 ease-standard',
              active ? 'font-bold text-ink' : 'font-normal text-ink-muted'
            )}
            style={{
              borderBottomStyle: 'solid',
              borderBottomWidth: active ? 3 : 2,
              borderBottomColor: TAJWEED_COLORS[group],
            }}
          >
            {TAJWEED_LABELS[group][locale]}
          </li>
        );
      })}
    </ul>
  );
}
