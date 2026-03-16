import type { LinkSource, Reciter } from '@/types';

const CACHE_KEY_PREFIX = 'reciters-cache';
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

type CacheEntry = {
  data: Reciter[];
  timestamp: number;
  locale: string;
  sources: string;
};

/**
 * Generates a cache key based on locale and enabled sources
 */
function getCacheKey(
  locale: string,
  enabledSources?: LinkSource[] | null
): string {
  const sourcesKey = enabledSources?.sort().join(',') || 'all';
  return `${CACHE_KEY_PREFIX}-${locale}-${sourcesKey}`;
}

/**
 * Checks if a cache entry is still valid based on TTL
 */
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  return now - entry.timestamp < CACHE_TTL;
}

/**
 * Retrieves cached reciters from localStorage if valid
 */
export function getCachedReciters(
  locale: string,
  enabledSources?: LinkSource[] | null
): Reciter[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const cacheKey = getCacheKey(locale, enabledSources);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);

    if (!isCacheValid(entry)) {
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('Failed to read reciters cache:', error);
    return null;
  }
}

/**
 * Saves reciters to localStorage cache
 */
export function setCachedReciters(
  data: Reciter[],
  locale: string,
  enabledSources?: LinkSource[] | null
): void {
  if (typeof window === 'undefined') return;

  try {
    const cacheKey = getCacheKey(locale, enabledSources);
    const sourcesKey = enabledSources?.sort().join(',') || 'all';

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      locale,
      sources: sourcesKey,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn('Failed to save reciters cache:', error);
  }
}

/**
 * Clears all reciters cache entries
 */
export function clearRecitersCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Failed to clear reciters cache:', error);
  }
}
