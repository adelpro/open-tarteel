import { mergedReciters } from '@/data/merged-reciters';

export type TargetProvider = 'quranFoundation' | 'mp3quran';

export const resolveChapterReciterId = (
  id?: string | null,
  moshafId?: string | null,
  targetProvider: TargetProvider = 'quranFoundation'
): number | null => {
  if (!id || !moshafId || typeof id !== 'string') {
    return null;
  }

  const isMp3Quran = id.startsWith('mp3quran');
  const isQuranAi = id.startsWith('qurani.ai');

  if (!isMp3Quran && !isQuranAi) {
    return null;
  }

  const reciter = mergedReciters.find((r) => {
    if (isMp3Quran) {
      return r.providers.mp3quran?.some(
        (f) =>
          f.id === id &&
          (Array.isArray(f.moshaf)
            ? f.moshaf.some((m) => m.id === moshafId)
            : (f.moshaf as unknown as { id: string }).id === moshafId)
      );
    }

    if (isQuranAi) {
      const quranAiProviders = (r.providers as Record<string, unknown>)
        .qurani_ai;
      if (Array.isArray(quranAiProviders)) {
        return quranAiProviders.some(
          (f: { id?: string; moshaf?: { id?: string }[] | { id?: string } }) =>
            f.id === id &&
            (Array.isArray(f.moshaf)
              ? f.moshaf.some((m) => m.id === moshafId)
              : f.moshaf?.id === moshafId)
        );
      }
    }

    return false;
  });

  if (
    targetProvider === 'quranFoundation' &&
    reciter?.providers.quran_foundation
  ) {
    return reciter.providers.quran_foundation[0]?.id ?? null;
  }

  return null;
};
