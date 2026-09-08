import { mergedReciters } from '@/data/merged-reciters';

export type TargetProvider = 'quranFoundation' | 'mp3quran';

interface ProviderEntry {
  id?: string;
  moshaf?: { id?: string }[] | { id?: string };
}

interface MergedReciterEntry {
  providers: {
    quran_foundation?: { id?: number }[];
    mp3quran?: ProviderEntry[];
    qurani_ai?: ProviderEntry[];
  };
}

const matchesMoshaf = (
  moshaf: { id?: string }[] | { id?: string } | undefined,
  targetMoshafId: string
): boolean => {
  if (Array.isArray(moshaf)) {
    return moshaf.some((m) => m.id === targetMoshafId);
  }
  return moshaf?.id === targetMoshafId;
};

const matchesProviderEntry = (
  entry: ProviderEntry,
  id: string,
  moshafId: string
): boolean => entry.id === id && matchesMoshaf(entry.moshaf, moshafId);

const matchesReciter = (
  r: MergedReciterEntry,
  id: string,
  moshafId: string,
  isMp3Quran: boolean,
  isQuranAi: boolean
): boolean => {
  if (isMp3Quran) {
    return (
      r.providers.mp3quran?.some((f) =>
        matchesProviderEntry(f as unknown as ProviderEntry, id, moshafId)
      ) ?? false
    );
  }

  if (isQuranAi) {
    const quranAi = (r.providers as Record<string, unknown>).qurani_ai;
    return (
      Array.isArray(quranAi) &&
      quranAi.some((f: ProviderEntry) => matchesProviderEntry(f, id, moshafId))
    );
  }

  return false;
};

const resolveTargetReciterId = (
  reciter: MergedReciterEntry,
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

  const reciter = (mergedReciters as unknown as MergedReciterEntry[]).find(
    (r) => matchesReciter(r, id, moshafId, isMp3Quran, isQuranAi)
  );

  if (!reciter) {
    return null;
  }

  return resolveTargetReciterId(reciter, targetProvider);
};
