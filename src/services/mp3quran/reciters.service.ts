import { Riwaya } from '@/constants';
import { LinkSource, LocaleType, Reciter } from '@/types';
import {
  getLanguage,
  getPlayListFromApiMoshaf,
  getRiwayaKeyFromMoshafName,
} from '@/utils';

import { mp3Fetch } from './fetch-client';
export interface ApiMoshaf {
  id: number;
  name: string;
  server: string;
  letter: string;
  surah_total: number;
  moshaf_type: number;
  surah_list: string; // '1,2,3,4,5,6,7,8,9,10,...'
  date: string;
}

export interface ApiReciter {
  id: number;
  name: string;
  letter: string;
  moshaf: ApiMoshaf[];
}

interface RecitersResponse {
  reciters: ApiReciter[];
}

export async function getReciters(params?: {
  locale?: LocaleType;
  reciterId?: number;
  rewaya?: number;
  sura?: number;
}): Promise<Reciter[]> {
  try {
    const data = await mp3Fetch<RecitersResponse>('/reciters', {
      language: getLanguage(params?.locale),
      reciter: params?.reciterId,
      rewaya: params?.rewaya,
      sura: params?.sura,
    });

    return data.reciters.flatMap((apiReciter) =>
      mapApiReciterToReciter(apiReciter, params?.locale)
    );
  } catch (error) {
    console.error('getAllReciters', error);
    return [];
  }
}

export async function getReciterById(
  reciterId: number,
  locale: LocaleType = 'ar',
  rewaya?: number
): Promise<Reciter | null> {
  try {
    const data = await mp3Fetch<RecitersResponse>('/reciters', {
      language: getLanguage(locale),
      reciter: reciterId,
      rewaya,
    });

    return mapApiReciterToReciter(data.reciters?.[0], locale)[0];
  } catch (error) {
    console.error('getReciterById', error);
    return null;
  }
}

export function mapApiReciterToReciter(
  apiReciter?: ApiReciter,
  locale: LocaleType = 'ar'
): Reciter[] {
  if (!apiReciter) return [];
  return apiReciter.moshaf.map((apiMoshaf: ApiMoshaf) => {
    const playlist = getPlayListFromApiMoshaf(apiMoshaf);
    const riwayaName = apiMoshaf?.name ?? '';
    const riwayaKey = getRiwayaKeyFromMoshafName(riwayaName, locale);

    return {
      id: String(apiReciter.id),
      name: apiReciter.name,
      source: LinkSource.MP3QURAN,
      moshaf: {
        id: String(apiMoshaf.id),
        name: apiMoshaf.name,
        riwaya: Riwaya[riwayaKey],
        surah_total: apiMoshaf.surah_total,
        server: apiMoshaf.server,
        playlist,
      },
    };
  });
}
