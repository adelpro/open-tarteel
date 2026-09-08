import {
  MergedReciter,
  MergedReciterMoshaf,
  MergedReciterProviderEntry,
  mergedReciters,
} from '@/data/merged-reciters';

export type TargetProvider = 'quranFoundation' | 'mp3quran';

const matchesMoshaf = (
  moshaf: MergedReciterMoshaf[] | MergedReciterMoshaf | undefined,
  targetMoshafId: string
): boolean => {
  if (Array.isArray(moshaf)) {
    return moshaf.some((m) => m.id === targetMoshafId);
  }
  return moshaf?.id === targetMoshafId;
};

const matchesProviderEntry = (
  entry: MergedReciterProviderEntry,
  id: string,
  moshafId: string
): boolean => entry.id === id && matchesMoshaf(entry.moshaf, moshafId);

const matchesReciter = (
  r: MergedReciter,
  id: string,
  moshafId: string,
  isMp3Quran: boolean,
  isQuranAi: boolean
): boolean => {
  if (isMp3Quran) {
    return (
      r.providers.mp3quran?.some((f) =>
        matchesProviderEntry(f, id, moshafId)
      ) ?? false
    );
  }

  if (isQuranAi) {
    return (
      r.providers.qurani_ai?.some((f) =>
        matchesProviderEntry(f, id, moshafId)
      ) ?? false
    );
  }

  return false;
};

const resolveTargetReciterId = (
  reciter: MergedReciter,
  targetProvider: TargetProvider
): number | null => {
  if (
    targetProvider === 'quranFoundation' &&
    reciter.providers.quran_foundation
  ) {
    return reciter.providers.quran_foundation[0]?.id ?? null;
  }

  return null;
};

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

  const reciter = mergedReciters.find((r) =>
    matchesReciter(r, id, moshafId, isMp3Quran, isQuranAi)
  );

  if (!reciter) {
    return null;
  }

  return resolveTargetReciterId(reciter, targetProvider);
};
