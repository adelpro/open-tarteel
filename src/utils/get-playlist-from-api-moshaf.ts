import { ApiMoshaf } from '@/services';
import { Reciter } from '@/types';

export const getPlayListFromApiMoshaf = (
  moshaf: ApiMoshaf
): Reciter['moshaf']['playlist'] => {
  return moshaf.surah_list.split(',').map((surahId: string) => ({
    surahId: surahId,
    link: `${moshaf.server}${surahId.padStart(3, '0')}.mp3`,
  }));
};
