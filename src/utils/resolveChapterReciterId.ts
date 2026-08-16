import { mergedReciters } from '@/data/merged-reciters';

export type TargetProvider = 'quranFoundation' | 'mp3quran';

export const resolveChapterReciterId = (
  id?: string | null,
  moshafId?: string | null,
  targetProvider: TargetProvider = 'quranFoundation'
): number | null => {
  if (
    !id ||
    !moshafId ||
    typeof id !== 'string' ||
    !id.startsWith('mp3quran')
  ) {
    return null;
  }

  const reciter = mergedReciters.find((r) =>
    r.providers.mp3quran?.some(
      (f) => f.id === id && f.moshaf?.some((m) => m.id === moshafId)
    )
  );

  if (
    targetProvider === 'quranFoundation' &&
    reciter?.providers.quran_foundation
  ) {
    return reciter.providers.quran_foundation[0]?.id ?? null;
  }

  return null;
};
