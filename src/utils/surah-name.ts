import type { Language } from '@/constants/language';
import type { Surah } from '@/types/surah';

import { removeTashkeel } from './search';

/**
 * User-facing surah title for a UI locale: German titles for `de`, English
 * for `en`, and tashkeel-stripped Arabic otherwise. Centralizes the locale
 * selection so player and download-progress labels cannot drift apart.
 */
export const getSurahDisplayName = (
  surah: Surah,
  locale: Language | string
): string => {
  if (locale === 'en') return surah.englishName;
  if (locale === 'de') return surah.germanName;
  return removeTashkeel(surah.name);
};
