import type { SurahText } from '@/types';

import { fetchSurahText } from './quran-text.adapter';

export type { AyahEdition } from './reciter-mapping';
export {
  getAyahEditionForReciter,
  VERSE_BY_VERSE_EDITIONS,
} from './reciter-mapping';
export {
  ayahTextWeight,
  type AyahTimestamp,
  buildEstimatedTimestamps,
  getAyahAtTime,
} from './timestamps';

const TEXT_CACHE_PREFIX = 'surah-text:';

const readCache = (key: string): SurahText | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SurahText) : null;
  } catch {
    return null;
  }
};

const writeCache = (key: string, data: SurahText): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — ignore, the fetch still succeeded.
  }
};

/**
 * Fetches the text of a surah.
 *
 * - On the server: fetches alquran.cloud directly (used for SSR metadata).
 * - On the client: reads from the localStorage cache first, then falls back
 *   to the `/api/surah/{id}` proxy route and persists the result.
 */
export async function getSurahText(
  surahId: string | number
): Promise<SurahText> {
  const id = String(surahId);
  const cacheKey = `${TEXT_CACHE_PREFIX}${id}`;

  const isServer = typeof window === 'undefined';

  if (isServer) {
    return fetchSurahText(Number(id));
  }

  const cached = readCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(`/api/surah/${id}`, {
    next: { revalidate: 31536000 },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch surah ${id}: ${response.statusText}`);
  }

  const data = (await response.json()) as SurahText;
  writeCache(cacheKey, data);
  return data;
}
