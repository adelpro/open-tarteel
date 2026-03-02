import type { Reciter } from '@/types';
import { LinkSource } from '@/types';

import { generatePlaylist, resolveRiwaya } from './mp3quran.helpers';
import type { Mp3QuranApiResponse } from './mp3quran.types';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';

export const Mp3QuranAdapter: ReciterSource = {
  source: LinkSource.MP3QURAN,

  async getReciters(lang: 'ar' | 'en'): Promise<Reciter[]> {
    const apiLang = lang === 'en' ? 'eng' : 'ar';

    const response = await retryFetch(
      `https://www.mp3quran.net/api/v3/reciters?language=${apiLang}`
    );

    const data: Mp3QuranApiResponse = await response.json();
    const reciters: Reciter[] = [];

    for (const apiReciter of data.reciters) {
      for (const apiMoshaf of apiReciter.moshaf) {
        reciters.push({
          id: `${LinkSource.MP3QURAN}-${apiReciter.id}`,
          name: apiReciter.name,
          source: LinkSource.MP3QURAN,
          moshaf: {
            id: String(apiMoshaf.id),
            name: apiMoshaf.name,
            riwaya: resolveRiwaya(apiMoshaf.name, lang),
            server: apiMoshaf.server,
            surah_total: apiMoshaf.surah_total,
            playlist: generatePlaylist(apiMoshaf),
          },
        });
      }
    }

    return reciters;
  },
};
