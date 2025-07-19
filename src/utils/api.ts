import {
  LinkSource,
  MP3APIMoshaf,
  mp3QuranAPiResponse,
  Reciter,
} from '@/types';
import { Playlist } from '@/types/playlist';

import { getRiwayaFromMoshafName } from './get-riwaya-from-mushaf-name';

const generatePlaylist = (moshaf: MP3APIMoshaf): Playlist => {
  const result = moshaf.surah_list.split(',').map((surahId: string) => ({
    surahId: surahId,
    link: `${moshaf.server}${surahId.padStart(3, '0')}.mp3`,
  }));
  return result;
};
// Function to fetch reciters from MP3Quran API
export async function getAllReciters(
  locale: 'ar' | 'en' = 'ar'
): Promise<Reciter[]> {
  try {
    const response = await fetch(
      `https://www.mp3quran.net/api/v3/reciters?language=${locale}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const data: mp3QuranAPiResponse = await response.json();
    const reciters: Reciter[] = [];

    for (const apiReciter of data.reciters) {
      for (const apiMoshaf of apiReciter.moshaf) {
        const playlist = generatePlaylist(apiMoshaf);
        const riwaya = getRiwayaFromMoshafName(apiMoshaf.name);

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
  } catch (error) {
    console.error('Error fetching reciters:', error);
    return [];
  }
}

// Fetch reciter data from API
export async function getReciter(
  id: number,
  moshafId: number,
  locale: 'ar' | 'en' = 'ar'
): Promise<Reciter | undefined> {
  try {
    const response = await fetch(
      `https://www.mp3quran.net/api/v3/reciters?language=${locale}&reciter=${id}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return undefined;

    const apiRecitersData: mp3QuranAPiResponse = await response.json();
    const apiReciter = apiRecitersData.reciters.find((r) => r.id === id);
    if (!apiReciter) return undefined;

    const apiMoshaf = apiReciter.moshaf.find(
      (m) => m.id.toString() === moshafId.toString()
    );

    if (!apiMoshaf) return undefined;

    const playlist = generatePlaylist(apiMoshaf);
    const riwaya = getRiwayaFromMoshafName(apiMoshaf.name);

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
  } catch (error) {
    console.error('Error fetching reciter from API:', error);
    return undefined;
  }
}
