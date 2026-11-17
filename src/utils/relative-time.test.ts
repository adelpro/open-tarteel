import { describe, expect, it } from 'vitest';

import { relativeTime } from './relative-time';

// Ported from Tilawa's test/relative-time.test.ts.

const now = Date.UTC(2026, 9, 30, 12, 0, 0);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ago = (elapsed: number) => relativeTime(now - elapsed, now);

describe('relativeTime', () => {
  it('reads the first seconds as now, not zero minutes', () => {
    expect(ago(0)).toEqual({ unit: 'now', value: 0 });
    expect(ago(44_999)).toEqual({ unit: 'now', value: 0 });
    expect(ago(45_000)).toEqual({ unit: 'minute', value: 1 });
  });

  it('rounds minutes down and never reads zero', () => {
    expect(ago(90_000)).toEqual({ unit: 'minute', value: 1 });
    expect(ago(59 * MINUTE)).toEqual({ unit: 'minute', value: 59 });
  });

  it('switches to hours exactly at the hour', () => {
    expect(ago(HOUR - 1)).toEqual({ unit: 'minute', value: 59 });
    expect(ago(HOUR)).toEqual({ unit: 'hour', value: 1 });
    expect(ago(23 * HOUR)).toEqual({ unit: 'hour', value: 23 });
  });

  it('stops days at a week, weeks at a month and months at a year', () => {
    expect(ago(DAY)).toEqual({ unit: 'day', value: 1 });
    expect(ago(6 * DAY)).toEqual({ unit: 'day', value: 6 });
    expect(ago(7 * DAY)).toEqual({ unit: 'week', value: 1 });
    expect(ago(29 * DAY)).toEqual({ unit: 'week', value: 4 });
    expect(ago(30 * DAY)).toEqual({ unit: 'month', value: 1 });
    expect(ago(364 * DAY)).toEqual({ unit: 'month', value: 12 });
    expect(ago(365 * DAY)).toEqual({ unit: 'year', value: 1 });
  });

  it('reads a future stamp or a missing one as now', () => {
    expect(relativeTime(now + 5 * MINUTE, now)).toEqual({
      unit: 'now',
      value: 0,
    });
    expect(relativeTime(Number.NaN, now)).toEqual({ unit: 'now', value: 0 });
  });
});
