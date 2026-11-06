import type { Language } from '@/constants/language';
import type { Moshaf, Playlist, Reciter } from '@/types';
import { LinkSource, Riwaya } from '@/types';

import { isMp3QuranV4Enabled } from './flags';
import type { Mp3QuranV4List, Mp3QuranV4Recitation } from './mp3quran-v4.types';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';

const DEFAULT_BASE = 'https://api-staging.mp3quran.net/v4';

const getBase = (): string => process.env.MP3QURAN_V4_BASE_URL || DEFAULT_BASE;

const getLocale = (lang: Language): string => (lang === 'ar' ? 'ar' : 'en');

const RIWAYA_CODES: Record<string, keyof typeof Riwaya> = {
  hafs_an_asim: 'Hafs',
  warsh_an_nafi: 'Warsh',
  qalun_an_nafi: 'Qaloon',
  khalaf_an_hamzah: 'Khalaf',
  bazzi_an_ibn_kathir: 'AlBazzi',
  qunbul_an_ibn_kathir: 'AlBazzi',
  susi_an_abu_amr: 'AlSoosi',
  duri_an_kisai: 'AlDooriKisai',
  duri_an_abu_amr: 'AlDooriAbuAmr',
  shubah_an_asim: 'Shuaba',
  ibn_dhakwan_an_ibn_amir: 'IbnZakwan',
  hisham_an_ibn_amir: 'Hisham',
  ibn_jammaz_an_abu_jafar: 'IbnJammaz',
  rawh_an_yaqub: 'Yaqoub',
  ruways_an_yaqub: 'Yaqoub',
};

const resolveRiwaya = (code?: string): Riwaya => {
  const key = code ? RIWAYA_CODES[code] : undefined;
  return key ? Riwaya[key] : Riwaya.Hafs;
};

const fetchAll = async <T>(path: string, lang: Language): Promise<T[]> => {
  const base = getBase();
  let url: string | undefined = `${base}${path}?locale=${getLocale(lang)}`;
  const items: T[] = [];

  while (url) {
    const response = await retryFetch(url);
    const body: Mp3QuranV4List<T> = await response.json();
    if (!Array.isArray(body.data)) {
      throw new Error('Unexpected MP3Quran v4 response');
    }
    items.push(...body.data);
    url = body.links?.next
      ? new URL(body.links.next, base).toString()
      : undefined;
  }

  return items;
};

export const Mp3QuranV4Adapter = {
  source: LinkSource.MP3QURAN_V4,

  async getReciters(lang: Language): Promise<Reciter[]> {
    if (!isMp3QuranV4Enabled()) return [];

    const recitations = await fetchAll<Mp3QuranV4Recitation>(
      '/recitations',
      lang
    );

    return recitations.map((recitation) => {
      const riwayah = recitation.riwayahs[0];
      const moshaf: Moshaf = {
        id: String(recitation.id),
        name: riwayah?.name ?? recitation.style,
        riwaya: resolveRiwaya(riwayah?.code),
        server: recitation.audio.base,
        surah_total: String(recitation.coverage.surahs.length),
        surahIds: recitation.coverage.surahs.join(','),
        recitationCode: recitation.code,
        hasTimings: recitation.has_ayah_timings,
        playlist: [],
      };

      return {
        id: `${LinkSource.MP3QURAN_V4}-${recitation.reciter.code}`,
        name: recitation.reciter.name,
        source: LinkSource.MP3QURAN_V4,
        moshaf,
      } satisfies Reciter;
    });
  },

  async getPlaylist(moshaf: Moshaf): Promise<Playlist> {
    const ids = moshaf.surahIds?.split(',').filter(Boolean) ?? [];
    return ids.map((id) => ({
      surahId: id,
      link: `${moshaf.server}${id.padStart(3, '0')}.mp3`,
    }));
  },
} satisfies ReciterSource;
