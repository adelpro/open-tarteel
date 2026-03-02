import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { CacheOptions } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const DEFAULT_CACHE_OPTION = {
  locale: 'ar',
  ttl: Date.now() + DEFAULT_TTL_MS,
  forceRefresh: false,
  keepOnError: true,
  lastConsumedAt: Date.now(),
};
export function createCacheOptions(
  overrides: Partial<CacheOptions> = {},
  ttlMs: number = DEFAULT_TTL_MS
): CacheOptions {
  const now = Date.now();

  return {
    locale: 'ar',
    ttl: now + ttlMs,
    forceRefresh: false,
    keepOnError: true,
    lastConsumedAt: now,
    ...overrides,
  };
}
