import { Language } from '@/constants/language';
import type { Reciter } from '@/types';
import { LinkSource } from '@/types';

import { ItqanAdapter } from './itqan.adapter';
import { Mp3QuranAdapter } from './mp3quran.adapter';
import { QuranAiAdapter } from './quranai.adapter';
import { QuranFoundationAdapter } from './quranfoundation.adapter';
import type { ReciterSource } from './reciter-source';

const adapters: ReciterSource[] = [
  Mp3QuranAdapter,
  ItqanAdapter,
  QuranAiAdapter,
  QuranFoundationAdapter,
];

const VALID_SOURCES = new Set<string>(Object.values(LinkSource));
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  reciters: Reciter[];
  expiresAt: number;
}

const recitersMemoryCache = new Map<string, CacheEntry>();
const inFlightPromises = new Map<string, Promise<Reciter[]>>();

export const resetRecitersCache = (): void => {
  recitersMemoryCache.clear();
  inFlightPromises.clear();
};

const getCacheKey = (
  lang: Language,
  enabledSources?: LinkSource[] | null
): string => {
  const sourcesKey =
    enabledSources && enabledSources.length > 0
      ? [...enabledSources].sort().join(',')
      : 'all';
  return `${lang}:${sourcesKey}`;
};

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

async function fetchRecitersFromAdapters(
  lang: Language,
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

/**
 * Fetches reciters from the specified or all sources in parallel.
 * Results are cached in-process and deduplicated in flight during SSG/build
 * to avoid hammering external APIs.
 * @param lang - Language for reciter names
 * @param enabledSources - If provided, only fetch from these sources. Otherwise fetch from all.
 */
export async function getAllRecitersFromAdapters(
  lang: Language = 'ar',
  enabledSources?: LinkSource[] | null
): Promise<Reciter[]> {
  if (process.env.NODE_ENV === 'test') {
    return fetchRecitersFromAdapters(lang, enabledSources);
  }

  const cacheKey = getCacheKey(lang, enabledSources);
  const now = Date.now();
  const cached = recitersMemoryCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.reciters;
  }

  const inFlight = inFlightPromises.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = fetchRecitersFromAdapters(lang, enabledSources)
    .then((reciters) => {
      if (reciters.length > 0) {
        recitersMemoryCache.set(cacheKey, {
          reciters,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }
      return reciters;
    })
    .finally(() => {
      inFlightPromises.delete(cacheKey);
    });

  inFlightPromises.set(cacheKey, promise);
  return promise;
}

export { ItqanAdapter } from './itqan.adapter';
export { Mp3QuranAdapter } from './mp3quran.adapter';
export { getAyahAudioRange } from './quranai.adapter';
export { QuranAiAdapter } from './quranai.adapter';
export { QuranFoundationAdapter } from './quranfoundation.adapter';
export type { ReciterSource } from './reciter-source';
