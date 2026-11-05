import { unstable_cache } from 'next/cache';

import type { Language } from '@/constants/language';
import type { LinkSource, Reciter } from '@/types';

import { getAllRecitersFromAdapters } from './index';

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
const getCachedReciters = unstable_cache(
  (language: Language, sources: LinkSource[] | null) =>
    getAllRecitersFromAdapters(language, sources),
  ['reciters'],
  { revalidate: 3600 }
);

export const getAllRecitersCached = (
  language: Language,
  sources?: LinkSource[] | null
): Promise<Reciter[]> => getCachedReciters(language, sources ?? null);
