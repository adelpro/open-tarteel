import { unstable_cache } from 'next/cache';

import type { Language } from '@/constants/language';
import { type AyahTiming, getSurahTimings } from '@/services/timings';
import type { LinkSource, Moshaf, Playlist, Reciter } from '@/types';

import { getAllRecitersFromAdapters, getReciterPlaylist } from './index';

/**
 * Server-side cache for the upstream reciter APIs.
 *
 * Without this, every request to `/api/reciters` re-fetches MP3Quran and does
 * an N+1 fetch loop against Itqan. The route-level `Cache-Control` header only
 * helps when a CDN is present, so keep a Next data-cache layer as well.
 *
 * Note: Next refuses entries over 2 MB. The list DTO (~233 KB for all 549
 * reciters) and per-reciter playlists stay well below that limit, so this
 * layer is effective; warm `/api/reciters` responses are ~7 ms.
 */
// Bump when the adapter shape, language handling, or pagination changes so a
// deploy never serves data cached by the previous code.
// v6 adds the per-track `hasTimings` flag to cached Itqan playlists.
const CACHE_VERSION = 'v6-timings';

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
  (source: LinkSource, moshaf: Moshaf, language: Language) =>
    getReciterPlaylist(source, moshaf, language),
  ['reciter-playlist', CACHE_VERSION],
  { revalidate: 3600 }
);

export const getReciterPlaylistCached = (
  source: LinkSource,
  moshaf: Moshaf,
  language: Language
): Promise<Playlist | null> =>
  getCachedReciterPlaylist(source, moshaf, language);

/** Ayah timings are stable per recording, so keep them for a day. */
const getCachedSurahTimings = unstable_cache(
  (source: LinkSource, moshaf: Moshaf, surah: number) =>
    getSurahTimings(source, moshaf, surah),
  ['surah-timings', CACHE_VERSION],
  { revalidate: 86400 }
);

export const getSurahTimingsCached = (
  source: LinkSource,
  moshaf: Moshaf,
  surah: number
): Promise<AyahTiming[]> => getCachedSurahTimings(source, moshaf, surah);
