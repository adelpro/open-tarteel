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
// Function to fetch reciters from MP3Quran API
export async function getAllReciters(
  locale: 'ar' | 'en' = 'ar'
): Promise<Reciter[]> {
  const language = locale === 'en' ? 'eng' : 'ar';
  try {
    const response = await fetch(`/api/reciters?language=${language}`, {
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

// Fetch reciter data from API
export async function getReciter(
  id: number,
  moshafId: number,
  locale: 'ar' | 'en' = 'ar'
): Promise<Reciter | undefined> {
  try {
    const language = locale === 'en' ? 'eng' : 'ar';
    const response = await fetch(
      `/api/reciters/${id}/${moshafId}?language=${language}`,
      { next: { revalidate: 3600 } }
    );

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
