import type { AyahAudioItem, PlaylistItem, Reciter } from '@/types';
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
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';
import { Language } from '@/constants/language';

const SURAH_TOTAL = 114;
export const MAX_AYAHS_IN_SURAH = 286;
const EDITION_FETCH_CONCURRENCY = 3;
const PROBE_SURAH_NUMBER = 1;
const AYAH_RANGE_FETCH_CACHE_SECONDS = 3600;

const EDITIONS_ENDPOINT = `${QURANAI_BASE_URL}/edition/?format=audio`;

const fetchAyahRange = (url: string): Promise<Response> =>
  retryFetch(url, 3, undefined, {
    next: { revalidate: AYAH_RANGE_FETCH_CACHE_SECONDS },
  });

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
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

const fetchEditionPlaylist = async (
  editionIdentifier: string
): Promise<PlaylistItem[]> => {
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
      return [];
    }

    const baseUrl = extractSurahAudioBaseUrl(probeAudioUrl);
    if (!baseUrl) {
      console.warn(
        `Quran.ai: invalid full-surah audio URL for edition ${editionIdentifier}: ${probeAudioUrl}`
      );
      return [];
    }

    const playlist: PlaylistItem[] = [
      { surahId: String(PROBE_SURAH_NUMBER), link: probeAudioUrl },
    ];
    for (
      let surahNumber = PROBE_SURAH_NUMBER + 1;
      surahNumber <= SURAH_TOTAL;
      surahNumber += 1
    ) {
      playlist.push({
        surahId: String(surahNumber),
        link: buildSurahAudioUrl(baseUrl, surahNumber),
      });
    }
    return playlist;
  } catch {
    return [];
  }
};

export const QuranAiAdapter: ReciterSource = {
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
          const playlist = await fetchEditionPlaylist(edition.identifier);
          if (playlist.length === 0) {
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
              server: '',
              surah_total: String(playlist.length),
              playlist,
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
};

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
  const body: QuranAiSurahResponse = await response.json();

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
