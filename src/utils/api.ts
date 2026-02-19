import {
  LinkSource,
  MP3APIMoshaf,
  mp3QuranAPiResponse,
  Reciter,
  Riwaya,
} from '@/types';
import { Playlist } from '@/types/playlist';

import { getRiwayaKeyFromMoshafName } from './get-riwaya-from-mushaf';

const generatePlaylist = (moshaf: MP3APIMoshaf): Playlist => {
  const result = moshaf.surah_list.split(',').map((surahId: string) => ({
    surahId: surahId,
    link: `${moshaf.server}${surahId.padStart(3, '0')}.mp3`,
  }));
  return result;
};
/**
 * Fetches all reciters from MP3Quran API
 *
 * Note: Uses different URL strategy for server vs client to handle SSR:
 * - Server-side: Calls mp3quran.net API directly with absolute URL
 *   (Node.js fetch() requires absolute URLs, relative URLs throw "Invalid URL" error)
 * - Client-side: Uses internal API route with relative URL
 *   (Browser automatically resolves relative URLs to current domain)
 *
 * This prevents SSR failures when users directly visit reciter pages or refresh them.
 */
export async function getAllReciters(
  locale: 'ar' | 'en' = 'ar'
): Promise<Reciter[]> {
  const language = locale === 'en' ? 'eng' : 'ar';

  // Server needs absolute URL, client works with relative URL
  const isServer = typeof window === 'undefined';
  const url = isServer
    ? `https://www.mp3quran.net/api/v3/reciters?language=${language}`
    : `/api/reciters?language=${language}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reciters, ${response.statusText}`);
    }

    const data: mp3QuranAPiResponse = await response.json();
    const reciters: Reciter[] = [];

    for (const apiReciter of data.reciters) {
      for (const apiMoshaf of apiReciter.moshaf) {
        const playlist = generatePlaylist(apiMoshaf);
        const riwayaKey = getRiwayaKeyFromMoshafName(apiMoshaf.name, locale);
        const riwaya = Riwaya[riwayaKey];

        reciters.push({
          id: apiReciter.id,
          name: apiReciter.name,
          source: LinkSource.MP3QURAN,
          moshaf: {
            id: apiMoshaf.id,
            name: apiMoshaf.name,
            riwaya,
            server: apiMoshaf.server,
            surah_total: apiMoshaf.surah_total,
            playlist,
          },
        });
      }
    }

    return reciters;
  } catch {
    return [];
  }
}

/**
 * Fetches a specific reciter's data from MP3Quran API
 *
 * Note: Uses different URL strategy for server vs client (same reason as getAllReciters):
 * - Server-side: Direct API call with absolute URL to avoid "Invalid URL" errors
 * - Client-side: Internal API route with relative URL for browser compatibility
 */
export async function getReciter(
  id: number,
  moshafId: number,
  locale: 'ar' | 'en' = 'ar'
): Promise<Reciter | undefined> {
  try {
    const language = locale === 'en' ? 'eng' : 'ar';

    // Server needs absolute URL, client works with relative URL
    const isServer = typeof window === 'undefined';
    const url = isServer
      ? `https://www.mp3quran.net/api/v3/reciters?language=${language}&reciter=${id}`
      : `/api/reciters/${id}/${moshafId}?language=${language}`;

    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) return undefined;

    const { reciter: apiReciter, moshaf: apiMoshaf } = await response.json();

    if (!apiReciter || !apiMoshaf) return undefined;

    const playlist = generatePlaylist(apiMoshaf);
    const riwayaKey = getRiwayaKeyFromMoshafName(apiMoshaf.name, locale);
    const riwaya = Riwaya[riwayaKey];
    return {
      id: apiReciter.id,
      name: apiReciter.name,
      source: LinkSource.MP3QURAN,
      moshaf: {
        id: apiMoshaf.id,
        name: apiMoshaf.name,
        riwaya,
        server: apiMoshaf.server,
        surah_total: apiMoshaf.surah_total,
        playlist,
      },
    };
  } catch {
    return undefined;
  }
}
