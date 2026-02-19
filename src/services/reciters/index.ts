import type { Reciter } from '@/types';

import { ItqanAdapter } from './itqan.adapter';
import { Mp3QuranAdapter } from './mp3quran.adapter';
import type { ReciterSource } from './reciter-source';

const adapters: ReciterSource[] = [Mp3QuranAdapter, ItqanAdapter];

/**
 * Fetches reciters from all registered sources in parallel.
 * Individual adapter failures are caught so one source going down
 * doesn't break the entire list.
 */
export async function getAllRecitersFromAdapters(
  lang: 'ar' | 'en' = 'ar'
): Promise<Reciter[]> {
  const results = await Promise.allSettled(
    adapters.map((adapter) => adapter.getReciters(lang))
  );

  const reciters: Reciter[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      reciters.push(...result.value);
    } else {
      console.warn('Adapter failed:', result.reason);
    }
  }

  return reciters;
}

export { ItqanAdapter } from './itqan.adapter';
export { Mp3QuranAdapter } from './mp3quran.adapter';
export type { ReciterSource } from './reciter-source';
