import { Language } from '@/constants/language';
import type { AyahAudioItem, Moshaf, Playlist, Reciter } from '@/types';
import { LinkSource } from '@/types';
import { getRiwayaKeyFromValue } from '@/utils/get-riwaya-from-mushaf';

import {
  buildSurahAudioUrl,
  buildSurahEndpoint,
  extractSurahAudio,
  extractSurahAudioBaseUrl,
  QURANAI_BASE_URL,
  resolveReciterName,
  resolveRiwayaFromNarrator,
} from './quranai.helpers';
import type {
  QuranAiEdition,
  QuranAiEditionListResponse,
  QuranAiSurahResponse,
} from './quranai.types';
import editionBases from './quranai-bases.json';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';

const SURAH_TOTAL = 114;
export const MAX_AYAHS_IN_SURAH = 286;
const EDITION_FETCH_CONCURRENCY = 3;
const PROBE_SURAH_NUMBER = 1;
const AYAH_RANGE_FETCH_CACHE_SECONDS = 3600;

const EDITIONS_ENDPOINT = `${QURANAI_BASE_URL}/edition/?format=audio`;

// 164 stable edition → CDN base entries generated from the live catalogue. Unknown
// editions still fall back to a single probe.
const EDITION_BASE_MAP = new Map<string, string>(Object.entries(editionBases));

const fetchAyahRange = (url: string): Promise<Response> =>
  retryFetch(url, 3, undefined, {
    next: { revalidate: AYAH_RANGE_FETCH_CACHE_SECONDS },
  });

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (_item: T, _index: number) => Promise<R>
): Promise<R[]> => {
  const indexedItems = items.map((item, index) => ({ item, index }));
  const results = new Map<number, R>();
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < indexedItems.length) {
      const entry = indexedItems.at(nextIndex);
      nextIndex += 1;
      if (entry) {
        const mapped = await mapper(entry.item, entry.index);
        results.set(entry.index, mapped);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return items.map((_, index) => results.get(index) as R);
};

const selectSurahEditions = (editions: QuranAiEdition[]): QuranAiEdition[] => {
  const seen = new Set<string>();
  const surahEditions: QuranAiEdition[] = [];
  for (const edition of editions) {
    if (edition.type !== 'surah') {
      continue;
    }
    if (seen.has(edition.identifier)) {
      continue;
    }
    seen.add(edition.identifier);
    surahEditions.push(edition);
  }
  return surahEditions;
};

const fetchEditionBase = async (
  editionIdentifier: string
): Promise<string | null> => {
  // Tests keep probing so they can exercise the parsing path.
  const knownBase =
    process.env.NODE_ENV === 'test'
      ? undefined
      : EDITION_BASE_MAP.get(editionIdentifier);
  if (knownBase) return knownBase;

  try {
    const response = await retryFetch(
      buildSurahEndpoint(PROBE_SURAH_NUMBER, editionIdentifier, { limit: 1 })
    );
    const body: QuranAiSurahResponse = await response.json();
    const probeAudioUrl = extractSurahAudio(body.data);
    if (!probeAudioUrl) {
      console.warn(
        `Quran.ai: no full-surah audio for edition ${editionIdentifier}`
      );
      return null;
    }

    const baseUrl = extractSurahAudioBaseUrl(probeAudioUrl);
    if (!baseUrl) {
      console.warn(
        `Quran.ai: invalid full-surah audio URL for edition ${editionIdentifier}: ${probeAudioUrl}`
      );
      return null;
    }

    return baseUrl;
  } catch {
    return null;
  }
};

export const QuranAiAdapter = {
  source: LinkSource.QURANAI,

  async getReciters(lang: Language): Promise<Reciter[]> {
    const response = await retryFetch(EDITIONS_ENDPOINT);
    const body: QuranAiEditionListResponse = await response.json();
    const editions = Array.isArray(body.data)
      ? selectSurahEditions(body.data)
      : [];

    const results = await mapWithConcurrency(
      editions,
      EDITION_FETCH_CONCURRENCY,
      async (edition) => {
        try {
          const server = await fetchEditionBase(edition.identifier);
          if (!server) {
            console.warn(
              `Quran.ai: skipping edition ${edition.identifier}: no playable surah audio`
            );
            return null;
          }
          const riwaya = resolveRiwayaFromNarrator(edition.narratorIdentifier);
          const reciter: Reciter = {
            id: `${LinkSource.QURANAI}-${edition.identifier}`,
            name: resolveReciterName(edition, lang),
            source: LinkSource.QURANAI,
            moshaf: {
              id: edition.identifier,
              name: getRiwayaKeyFromValue(riwaya),
              riwaya,
              server,
              surah_total: String(SURAH_TOTAL),
              playlist: [],
            },
          };
          return reciter;
        } catch (error) {
          console.warn(
            `Quran.ai: skipping edition ${edition.identifier}: ${error instanceof Error ? error.message : String(error)}`
          );
          return null;
        }
      }
    );

    return results.filter((reciter): reciter is Reciter => reciter !== null);
  },

  async getPlaylist(moshaf: Moshaf): Promise<Playlist> {
    if (!moshaf.server) return [];
    const total = Number(moshaf.surah_total) || SURAH_TOTAL;
    return Array.from({ length: total }, (_, index) => {
      const surahNumber = index + 1;
      return {
        surahId: String(surahNumber),
        link: buildSurahAudioUrl(moshaf.server, surahNumber),
      };
    });
  },
} satisfies ReciterSource;

export const validateAyahRange = (params: {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
}): void => {
  if (
    !Number.isInteger(params.surahNumber) ||
    params.surahNumber < 1 ||
    params.surahNumber > SURAH_TOTAL
  ) {
    throw new Error('surahNumber must be an integer between 1 and 114');
  }
  if (
    !Number.isInteger(params.startAyah) ||
    params.startAyah < 1 ||
    params.startAyah > MAX_AYAHS_IN_SURAH
  ) {
    throw new Error('startAyah must be an integer between 1 and 286');
  }
  if (
    !Number.isInteger(params.endAyah) ||
    params.endAyah < params.startAyah ||
    params.endAyah > MAX_AYAHS_IN_SURAH
  ) {
    throw new Error('endAyah must be an integer between startAyah and 286');
  }
};

export const getAyahAudioRange = async (params: {
  editionIdentifier: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
}): Promise<AyahAudioItem[]> => {
  const { editionIdentifier, surahNumber, startAyah, endAyah } = params;
  validateAyahRange(params);

  const limit = endAyah - startAyah + 1;
  const offset = startAyah - 1;
  const response = await fetchAyahRange(
    buildSurahEndpoint(surahNumber, editionIdentifier, { limit, offset })
  );
  const body = (await response.json()) as Partial<QuranAiSurahResponse>;

  // body.data is typed as required, but API may return unexpected shapes at runtime
  if (!body.data || !Array.isArray(body.data.ayahs)) {
    throw new Error(
      `Quran.ai: invalid surah response for edition ${editionIdentifier}`
    );
  }

  const numberOfAyahs = body.data.numberOfAyahs;
  const clampedEndAyah = Number.isInteger(numberOfAyahs)
    ? Math.min(endAyah, numberOfAyahs)
    : endAyah;

  return body.data.ayahs
    .filter(
      (ayah) =>
        ayah.numberInSurah >= startAyah && ayah.numberInSurah <= clampedEndAyah
    )
    .filter((ayah) => typeof ayah.audio === 'string' && ayah.audio.length > 0)
    .map((ayah) => ({
      surahId: String(surahNumber),
      ayahNumber: ayah.numberInSurah,
      link: ayah.audio,
    }));
};
