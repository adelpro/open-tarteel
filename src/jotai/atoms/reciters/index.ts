import { atom } from 'jotai';

import type { CacheOptions, Reciter } from '@/types';

/** The live reciters list — shared across every component that reads it */
export const recitersAtom = atom<Reciter[]>([]);

/** True while a fetch is in-flight */
export const recitersLoadingAtom = atom<boolean>(false);

/** Error message from last failed fetch, null if none */
export const recitersErrorAtom = atom<string | null>(null);

/**
 * True after IDB has been read on first mount.
 * Lets components distinguish "loading from IDB" vs "fetching from network".
 */
export const recitersHydratedAtom = atom<boolean>(false);

/** The options that govern the current cache entry (mirrors what's in IDB) */
export const recitersCacheOptionsAtom = atom<CacheOptions | null>(null);
