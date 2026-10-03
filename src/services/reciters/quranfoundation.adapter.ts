import { Language } from '@/constants/language';
import type { Playlist, Reciter } from '@/types';
import { LinkSource, Riwaya } from '@/types';

import {
  qfFetch,
  resetQuranFoundationClientCache,
} from './quran-foundation.client';
import type {
  QuranFoundationChapterAudioResponse,
  QuranFoundationChapterRecitersResponse,
} from './quranfoundation.types';
import type { ReciterSource } from './reciter-source';

const CHAPTER_RECITERS_PATH = '/content/api/v4/resources/chapter_reciters';
const CHAPTER_AUDIO_PATH = '/content/api/v4/chapter_recitations';

// Cache results in-process so SSG/build and concurrent calls don't hammer the provider.
const RESULTS_CACHE_TTL_MS = 55 * 60_000;
const resultsCache = new Map<
  Language,
  { reciters: Reciter[]; expiresAt: number }
>();

/** Test/debug helper: clears the cached access token and results. */
export const resetQuranFoundationCache = (): void => {
  resetQuranFoundationClientCache();
  resultsCache.clear();
};

const RIWAYA_KEY_MAP = new Map<keyof typeof Riwaya, Riwaya>([
  ['Warsh', Riwaya.Warsh],
  ['Khalaf', Riwaya.Khalaf],
  ['AlBazzi', Riwaya.AlBazzi],
  ['Qaloon', Riwaya.Qaloon],
  ['AlSoosi', Riwaya.AlSoosi],
  ['AlDooriKisai', Riwaya.AlDooriKisai],
  ['AlDooriAbuAmr', Riwaya.AlDooriAbuAmr],
  ['Shuaba', Riwaya.Shuaba],
  ['IbnZakwan', Riwaya.IbnZakwan],
  ['Hisham', Riwaya.Hisham],
  ['IbnJammaz', Riwaya.IbnJammaz],
  ['Yaqoub', Riwaya.Yaqoub],
  ['Hafs', Riwaya.Hafs],
]);

const resolveRiwayaEnum = (key: keyof typeof Riwaya): Riwaya =>
  RIWAYA_KEY_MAP.get(key) ?? Riwaya.Hafs;

/** Maps the API's `qirat.name` (e.g. "Hafs") to a Riwaya key, default Hafs. */
const riwayaKeyFromQirat = (qirat?: string | null): keyof typeof Riwaya =>
  (Object.keys(Riwaya) as (keyof typeof Riwaya)[]).find(
    (key) => key.toLowerCase() === (qirat ?? '').toLowerCase()
  ) ?? 'Hafs';

const fetchSingleReciter = async (
  reciter: QuranFoundationChapterRecitersResponse['reciters'][number]
): Promise<Reciter> => {
  const audioResponse = await qfFetch(`${CHAPTER_AUDIO_PATH}/${reciter.id}`);
  const audioData: QuranFoundationChapterAudioResponse =
    await audioResponse.json();

  if (!Array.isArray(audioData.audio_files)) {
    throw new Error(`Unexpected audio response for reciter ${reciter.id}`);
  }

  const name = reciter.translated_name?.name ?? reciter.name;
  if (!name) {
    throw new Error(
      `Skipping quran.foundation reciter ${reciter.id}: missing name`
    );
  }

  const playlist: Playlist = [...audioData.audio_files]
    .sort((a, b) => a.chapter_id - b.chapter_id)
    .map((audioFile) => ({
      surahId: String(audioFile.chapter_id),
      link: audioFile.audio_url,
    }));

  const riwayaKey = riwayaKeyFromQirat(reciter.qirat?.name);

  return {
    id: `${LinkSource.QURAN_FOUNDATION}-${reciter.id}`,
    name,
    source: LinkSource.QURAN_FOUNDATION,
    moshaf: {
      id: String(reciter.id),
      name,
      riwaya: resolveRiwayaEnum(riwayaKey),
      server: '',
      surah_total: String(playlist.length),
      playlist,
    },
  };
};

// Serialize concurrent calls so pacing stays under the free-tier limit.
let queue: Promise<unknown> = Promise.resolve();

export const QuranFoundationAdapter: ReciterSource = {
  source: LinkSource.QURAN_FOUNDATION,

  getReciters(lang: Language): Promise<Reciter[]> {
    const run = async (): Promise<Reciter[]> => {
      const cached = resultsCache.get(lang);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.reciters;
      }

      const listResponse = await qfFetch(
        `${CHAPTER_RECITERS_PATH}?language=${lang}`
      );

      const listData: QuranFoundationChapterRecitersResponse =
        await listResponse.json();

      if (!Array.isArray(listData.reciters)) {
        throw new Error('Unexpected quran.foundation reciters response');
      }

      const reciters: Reciter[] = [];
      for (const reciter of listData.reciters) {
        try {
          const item = await fetchSingleReciter(reciter);
          reciters.push(item);
        } catch (error) {
          console.warn(
            `Skipping quran.foundation reciter ${reciter.id}:`,
            error
          );
        }
      }
      resultsCache.set(lang, {
        reciters,
        expiresAt: Date.now() + RESULTS_CACHE_TTL_MS,
      });
      return reciters;
    };

    const result = queue.then(run, run);
    queue = result.catch(() => {
      /* intentional: keep queue alive */
    });
    return result;
  },
};
