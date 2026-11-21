import Tag from '@/components/ui/tag';
import {
  AHKAM_GROUPS,
  TAJWEED_COLORS,
  TAJWEED_LABELS,
} from '@/services/quran-text/rules';
import { cn } from '@/utils';

import styles from './follow-along.module.css';

export interface TajweedLegendProps {
  locale?: 'ar' | 'en';
  className?: string;
}

/**
 * Colours alone are not enough: theme changes and colour blindness break them.
 * Each item keeps its label, and the swatch inherits the group colour so the
 * legend and the line cannot disagree.
 */
export function TajweedLegend({
  locale = 'ar',
  className,
}: TajweedLegendProps) {
  return (
    <ul
      className={cn(styles.legend, className)}
      aria-label={locale === 'ar' ? 'أحكام التجويد' : 'Tajweed rules'}
    >
      {AHKAM_GROUPS.map((group) => (
        <li key={group} className={styles.legendItem}>
          <Tag
            variant="static"
            size="xs"
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
