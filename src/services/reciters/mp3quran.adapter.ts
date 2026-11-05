import { Language } from '@/constants/language';
import type { Moshaf, Playlist, Reciter } from '@/types';
import { LinkSource } from '@/types';

import { resolveRiwaya } from './mp3quran.helpers';
import type { Mp3QuranApiResponse } from './mp3quran.types';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';

const getMp3QuranApiLanguage = (lang: Language): string => {
  switch (lang) {
    case 'en':
      return 'eng';
    case 'de':
      return 'de';
    case 'ar':
    default:
      return 'ar';
  }
};

export const Mp3QuranAdapter = {
  source: LinkSource.MP3QURAN,

  async getReciters(lang: Language): Promise<Reciter[]> {
    const apiLang = getMp3QuranApiLanguage(lang);
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
            surah_total: String(apiMoshaf.surah_total),
            surahIds: apiMoshaf.surah_list,
            playlist: [],
          },
        });
      }
    }

    return reciters;
  },

  async getPlaylist(moshaf: Moshaf): Promise<Playlist> {
    if (!moshaf.server) return [];
    const ids = moshaf.surahIds?.split(',').filter(Boolean) ?? [];
    return ids.map((id) => ({
      surahId: id,
      link: `${moshaf.server}${id.padStart(3, '0')}.mp3`,
    }));
  },
} satisfies ReciterSource;
