import type { Reciter } from '@/types';
import { LinkSource } from '@/types';

import { ItqanAdapter } from './itqan.adapter';
import { Mp3QuranAdapter } from './mp3quran.adapter';
import type { ReciterSource } from './reciter-source';

const adapters: ReciterSource[] = [Mp3QuranAdapter, ItqanAdapter];

const VALID_SOURCES = new Set<string>(Object.values(LinkSource));

export function parseEnabledSources(
  value: string | null | undefined
): LinkSource[] | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const filtered = parts.filter((s) => VALID_SOURCES.has(s)) as LinkSource[];
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * Fetches reciters from the specified or all sources in parallel.
 * Individual adapter failures are caught so one source going down
 * doesn't break the entire list.
 * @param lang - Language for reciter names
 * @param enabledSources - If provided, only fetch from these sources. Otherwise fetch from all.
 */
export async function getAllRecitersFromAdapters(
  lang: 'ar' | 'en' = 'ar',
  enabledSources?: LinkSource[] | null
): Promise<Reciter[]> {
  const toFetch =
    enabledSources && enabledSources.length > 0
      ? adapters.filter((a) => enabledSources.includes(a.source as LinkSource))
      : adapters;

  const results = await Promise.allSettled(
    toFetch.map((adapter) => adapter.getReciters(lang))
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
