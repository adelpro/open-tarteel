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
export async function getAllReciters(): Promise<Reciter[]> {
  try {
    const response = await fetch(
      'https://www.mp3quran.net/api/v3/reciters?language=ar',
      {
        next: { revalidate: 3600 },
      }
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

type Props = {
  params: Promise<{
    id: string | undefined;
  }>;
};

// Fetch reciter data from API
export async function getReciter(
  id: number,
  moshafId: number
): Promise<Reciter | undefined> {
  try {
    const response = await fetch(
      ` https://www.mp3quran.net/api/v3/reciters?language=ar&reciter=${id}`,
      {
        next: { revalidate: 3600 }, // cache for 1 hour
      }
    );

    if (!response.ok) return undefined;

    const apiRecitersData = await response.json();

    // The API returns an array with one item if `reciter=id` is provided
    const apiReciter = apiRecitersData.reciters.find(
      (reciter: Reciter) => reciter.id === id
    );

    if (!apiReciter) return undefined;

    const apiMoshaf: MP3APIMoshaf = apiReciter.moshaf.find((id: string) => {
      id === moshafId.toString();
    });

    if (!apiMoshaf) return undefined;

    const riwaya = getRiwayaFromMoshafName(apiMoshaf.name);
    const playlist = generatePlaylist(apiMoshaf);
    return {
      id: apiReciter.id,
      name: apiReciter.name,
      moshaf: {
        id: apiMoshaf.id,
        name: apiMoshaf.name,
        riwaya,
        server: apiMoshaf.server,
        surah_total: apiMoshaf.surah_total,
        playlist,
      },

      source: LinkSource.MP3QURAN,
    };
  } catch (error) {
    console.error('Error fetching reciter from API:', error);
    return undefined;
  }
}
