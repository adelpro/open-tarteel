import { LinkSource, Reciter, Riwaya } from '@/types';

import { getRiwayaFromMoshafName } from './get-riwaya-from-mushaf-name';

interface ApiReciter {
  id: number;
  name: string;
  letter: string;
  date: string;
  moshaf: Array<{
    id: number;
    name: string;
    server: string;
    surah_total: number;
    moshaf_type: number;
    surah_list: string;
  }>;
}

interface ApiResponse {
  reciters: ApiReciter[];
}

// Function to fetch reciters from API
export async function fetchReciters(): Promise<Reciter[]> {
  try {
    const response = await fetch(
      'https://www.mp3quran.net/api/v3/reciters?language=ar'
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    // Transform API data to match your Reciter type
    const reciters: Reciter[] = data.reciters.map((apiReciter) => {
      // Get the primary moshaf (usually the first one)
      const primaryMoshaf = apiReciter.moshaf[0];

      // Create playlist from surah_list
      const playlist = primaryMoshaf?.surah_list
        ? primaryMoshaf.surah_list
            .split(',')
            .map(
              (number_) =>
                `${primaryMoshaf.server}${number_.padStart(3, '0')}.mp3`
            )
        : [];

      return {
        id: apiReciter.id,
        name: apiReciter.name,
        riwaya: primaryMoshaf
          ? getRiwayaFromMoshafName(primaryMoshaf.name)
          : Riwaya.Hafs,
        playlist,
        source: LinkSource.MP3QURAN,
        complet: primaryMoshaf?.surah_total === 114, // Complete if has all 114 surahs
      };
    });

    return reciters;
  } catch (error) {
    console.error('Error fetching reciters:', error);
    return []; // Return empty array on error
  }
}
