/**
 * Cached Reciters Fetch using Next.js 'use cache' directive
 *
 * NOTE: This is an experimental feature available in Next.js 15+
 * To enable, add to next.config.js:
 *
 * experimental: {
 *   dynamicIO: true,
 * }
 *
 * Documentation: https://nextjs.org/docs/app/api-reference/directives/use-cache
 *
 * USAGE:
 * Instead of calling getAllRecitersFromAdapters directly,
 * import and use getCachedReciters from this file.
 *
 * Benefits:
 * - Automatic function-level caching
 * - Integrated with Next.js build optimization
 * - Works seamlessly with React Server Components
 * - Reduces boilerplate code
 */

// Uncomment the following line to enable 'use cache' directive
// 'use cache';

import type { LinkSource, Reciter } from '@/types';

import { getAllRecitersFromAdapters } from './index';

/**
 * Fetches reciters with automatic caching via Next.js 'use cache' directive
 *
 * @param lang - Language for reciter names ('ar' or 'en')
 * @param enabledSources - Optional array of sources to fetch from
 * @returns Promise resolving to array of reciters
 */
export async function getCachedReciters(
  lang: 'ar' | 'en' = 'ar',
  enabledSources?: LinkSource[] | null
): Promise<Reciter[]> {
  return getAllRecitersFromAdapters(lang, enabledSources);
}

// Cache revalidation time: 1 hour (3600 seconds)
// This tells Next.js to revalidate the cache after this duration
export const revalidate = 3600;

/**
 * Example usage in a Server Component:
 *
 * import { getCachedReciters } from '@/services/reciters/cached-fetch';
 *
 * export default async function RecitersPage() {
 *   const reciters = await getCachedReciters('ar');
 *
 *   return (
 *     <div>
 *       {reciters.map(reciter => (
 *         <ReciterCard key={reciter.id} reciter={reciter} />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * The 'use cache' directive will automatically:
 * 1. Cache the function result
 * 2. Serve cached data on subsequent calls
 * 3. Revalidate after 3600 seconds
 * 4. Deduplicate concurrent requests
 */
