import { Riwaya } from '@/constants';
import type { LocaleType, Playlist } from '@/types';
import { getRiwayaKeyFromMoshafName } from '@/utils/get-riwaya-from-mushaf';

import type { Mp3QuranApiMoshaf } from './mp3quran.types';

export const generatePlaylist = (moshaf: Mp3QuranApiMoshaf): Playlist =>
  moshaf.surah_list.split(',').map((id) => ({
    surahId: id,
    link: `${moshaf.server}${id.padStart(3, '0')}.mp3`,
  }));

export const resolveRiwaya = (
  moshafName: string,
  locale: LocaleType
): Riwaya => {
  const key = getRiwayaKeyFromMoshafName(moshafName, locale);
  return Riwaya[key];
};
