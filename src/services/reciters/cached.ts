import { unstable_cache } from 'next/cache';

import type { Language } from '@/constants/language';
import type { LinkSource, Playlist, Reciter } from '@/types';

import { getAllRecitersFromAdapters, getReciterPlaylist } from './index';

/**
 * Server-side cache for the upstream reciter APIs.
 *
 * Without this, every request to `/api/reciters` re-fetches MP3Quran and does
 * an N+1 fetch loop against Itqan. The route-level `Cache-Control` header only
 * helps when a CDN is present, so keep a Next data-cache layer as well.
 *
 * Note: Next refuses entries over 2 MB. The current combined payload is larger
 * than that, so this layer is a no-op until the list/detail split lands
 * (see docs/ROADMAP.md, stage 5c).
 */
// Bump when the adapter shape, language handling, or pagination changes so a
// deploy never serves data cached by the previous code.
const CACHE_VERSION = 'v2-itqan-api-v1';

const getCachedReciters = unstable_cache(
  (language: Language, sources: LinkSource[] | null) =>
    getAllRecitersFromAdapters(language, sources),
  ['reciters', CACHE_VERSION],
  { revalidate: 3600 }
);

export const getAllRecitersCached = (
  language: Language,
  sources?: LinkSource[] | null
): Promise<Reciter[]> => getCachedReciters(language, sources ?? null);

/**
 * Lazy playlist cache. Itqan returns all 114 tracks (~555 KB) only when a
 * recitation is selected, so this stays below the 2 MB data-cache limit.
 */
const getCachedReciterPlaylist = unstable_cache(
  (source: LinkSource, moshafId: string, language: Language) =>
    getReciterPlaylist(source, moshafId, language),
  ['reciter-playlist', CACHE_VERSION],
  { revalidate: 3600 }
);

export const getReciterPlaylistCached = (
  source: LinkSource,
  moshafId: string,
  language: Language
): Promise<Playlist | null> =>
  getCachedReciterPlaylist(source, moshafId, language);
