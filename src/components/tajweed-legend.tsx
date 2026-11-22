import Tag from '@/components/ui/tag';
import {
  TAJWEED_COLORS,
  TAJWEED_GROUP_ORDER,
  TAJWEED_LABELS,
  type TajweedGroup,
} from '@/services/quran-text/rules';
import { cn } from '@/utils';

import styles from './follow-along.module.css';

export interface TajweedLegendProps {
  locale?: 'ar' | 'en';
  className?: string;
  /** Rule group of the word currently being recited. */
  activeGroup?: TajweedGroup | null;
}

/**
 * Colours alone are not enough: theme changes and colour blindness break them.
 * Each item keeps its label, and the swatch inherits the group colour so the
 * legend and the line cannot disagree.
 */
export function TajweedLegend({
  locale = 'ar',
  className,
  activeGroup,
}: TajweedLegendProps) {
  return (
    <ul
      className={cn(styles.legend, className)}
      aria-label={locale === 'ar' ? 'أحكام التجويد' : 'Tajweed rules'}
    >
      {TAJWEED_GROUP_ORDER.map((group) => (
        <li key={group} className={styles.legendItem}>
          <Tag
            variant="static"
            size="xs"
            className={cn(
              activeGroup === group &&
                'scale-110 ring-2 ring-primary/40 transition-transform duration-120'
            )}
            icon={
              <span
                className={styles.swatch}
                style={{ color: TAJWEED_COLORS[group] }}
                aria-hidden="true"
              />
            }
          >
            {TAJWEED_LABELS[group][locale]}
          </Tag>
        </li>
      ))}
    </ul>
  );
}
