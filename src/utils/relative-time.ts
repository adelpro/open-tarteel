/**
 * How long ago, as a unit and a count, with no words.
 *
 * The words come from `Intl.RelativeTimeFormat` through react-intl, which
 * already agrees the Arabic noun with the number (يوم، يومين، أيام). The
 * thresholds are the ones a person would use speaking: seconds are "now", days
 * stop at a week, months at a year.
 */
export type RelativeUnit =
  'now' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

type Relative = { unit: RelativeUnit; value: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function relativeTime(
  timestamp: number,
  now: number = Date.now()
): Relative {
  // A clock that jumped, or a row written by a device whose clock is ahead:
  // "in 3 minutes" is worse than "now".
  if (!Number.isFinite(timestamp)) return { unit: 'now', value: 0 };
  const elapsed = Math.max(0, now - timestamp);

  if (elapsed < 45_000) return { unit: 'now', value: 0 };
  if (elapsed < HOUR) {
    return { unit: 'minute', value: Math.max(1, Math.floor(elapsed / MINUTE)) };
  }
  if (elapsed < DAY) return { unit: 'hour', value: Math.floor(elapsed / HOUR) };
  if (elapsed < WEEK) return { unit: 'day', value: Math.floor(elapsed / DAY) };
  if (elapsed < MONTH) {
    return { unit: 'week', value: Math.floor(elapsed / WEEK) };
  }
  if (elapsed < YEAR) {
    return { unit: 'month', value: Math.floor(elapsed / MONTH) };
  }
  return { unit: 'year', value: Math.floor(elapsed / YEAR) };
}
