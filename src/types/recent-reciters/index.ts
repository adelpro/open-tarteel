import type { CacheEntry, Reciter } from '@/types';

export type RecentReciterEntry = CacheEntry<Reciter>;

/**
 * Composite key: `${reciterId}::${moshafId}::${locale}`
 * Same reciter in a different locale = different entry.
 * Same reciter + same locale = overwrites the existing entry.
 */
export type RecentReciterKey = `${string}::${string}::${string}`;
