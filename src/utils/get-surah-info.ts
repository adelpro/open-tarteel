import { EMPTY_SURAH, SURAH_BY_ID } from '@/constants';
import { Surah } from '@/types';

export function getSurahInfo(surahId: string): Surah {
  return SURAH_BY_ID.get(surahId) ?? EMPTY_SURAH;
}
