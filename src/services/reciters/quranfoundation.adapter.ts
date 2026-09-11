import { Language } from '@/constants/language';
import type { Playlist, Reciter } from '@/types';
import { LinkSource, Riwaya } from '@/types';

import type {
  QuranFoundationChapterAudioResponse,
  QuranFoundationChapterRecitersResponse,
  QuranFoundationTokenResponse,
} from './quranfoundation.types';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';

const DEFAULT_TOKEN_URL = 'https://oauth2.quran.foundation/oauth2/token';
const DEFAULT_API_BASE = 'https://apis.quran.foundation';

const CHAPTER_RECITERS_PATH = '/content/api/v4/resources/chapter_reciters';
const CHAPTER_AUDIO_PATH = '/content/api/v4/chapter_recitations';

// OAuth2 client credentials — server-only, never committed.
const CLIENT_ID_ENV_VAR = 'QURAN_FOUNDATION_CLIENT_ID';
const CLIENT_SECRET_ENV_VAR = 'QURAN_FOUNDATION_CLIENT_SECRET';
// Optional overrides (used to point at the prelive/test gateway).
const TOKEN_URL_ENV_VAR = 'QURAN_FOUNDATION_TOKEN_URL';
const API_BASE_ENV_VAR = 'QURAN_FOUNDATION_API_BASE';

// Pace requests to stay under the ~60 req/min free tier (0 disables pacing; used by tests).
const RATE_LIMIT_MS_ENV_VAR = 'QURAN_FOUNDATION_RATE_LIMIT_MS';
const DEFAULT_RATE_LIMIT_MS = 1100;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Client-credentials tokens expire hourly; cache until shortly before expiry.
let cachedToken: { value: string; expiresAt: number } | null = null;

// Cache results in-process so SSG/build and concurrent calls don't hammer the provider.
const RESULTS_CACHE_TTL_MS = 55 * 60_000;
const resultsCache = new Map<
  Language,
  { reciters: Reciter[]; expiresAt: number }
>();

/** Test/debug helper: clears the cached access token and results. */
export const resetQuranFoundationCache = (): void => {
  cachedToken = null;
  resultsCache.clear();
};

const readEnvironment = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set; quran.foundation provider is disabled`
    );
  }
  return value;
};

const rateLimitMs = (): number => {
  const override = Number(process.env[RATE_LIMIT_MS_ENV_VAR]);
  return Number.isFinite(override) && override >= 0
    ? override
    : DEFAULT_RATE_LIMIT_MS;
};

/** Exchanges client credentials for a fresh access token (cached hourly). */
const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientId = readEnvironment(CLIENT_ID_ENV_VAR);
  const clientSecret = readEnvironment(CLIENT_SECRET_ENV_VAR);
  const tokenUrl = process.env[TOKEN_URL_ENV_VAR] || DEFAULT_TOKEN_URL;

  let response: Response;
  try {
    response = await retryFetch(
      tokenUrl,
      3,
      rateLimitMs() > 0 ? delay : async () => {},
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString('base64')}`,
        },
        body: 'grant_type=client_credentials&scope=content',
      }
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to fetch quran.foundation access token (${reason})`
    );
  }

  const data = (await response.json()) as QuranFoundationTokenResponse;

  if (!data.access_token) {
    throw new Error('quran.foundation token response missing access_token');
  }

  // Buffer 60s so the token is refreshed before it actually expires.
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };

  return cachedToken.value;
};

/** Maps the API's `qirat.name` (e.g. "Hafs") to a Riwaya key, default Hafs. */
const riwayaKeyFromQirat = (qirat?: string | null): keyof typeof Riwaya =>
  (Object.keys(Riwaya) as Array<keyof typeof Riwaya>).find(
    (key) => key.toLowerCase() === (qirat ?? '').toLowerCase()
  ) ?? 'Hafs';

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

      const token = await getAccessToken();
      const clientId = readEnvironment(CLIENT_ID_ENV_VAR);
      const intervalMs = rateLimitMs();
      const backoff = intervalMs > 0 ? delay : async () => {};
      const apiBase = process.env[API_BASE_ENV_VAR] || DEFAULT_API_BASE;

      const fetchWithThrottle = async (url: string): Promise<Response> => {
        const response = await retryFetch(url, 3, backoff, {
          headers: {
            'x-auth-token': token,
            'x-client-id': clientId,
          },
        });
        if (intervalMs > 0) {
          await delay(intervalMs);
        }
        return response;
      };

      const listResponse = await fetchWithThrottle(
        `${apiBase}${CHAPTER_RECITERS_PATH}?language=${lang}`
      );

      const listData: QuranFoundationChapterRecitersResponse =
        await listResponse.json();

      if (!Array.isArray(listData.reciters)) {
        throw new Error('Unexpected quran.foundation reciters response');
      }

      const results: Array<Reciter | null> = [];

      for (const reciter of listData.reciters) {
        try {
          const audioResponse = await fetchWithThrottle(
            `${apiBase}${CHAPTER_AUDIO_PATH}/${reciter.id}`
          );
          const audioData: QuranFoundationChapterAudioResponse =
            await audioResponse.json();

          if (!Array.isArray(audioData.audio_files)) {
            throw new Error(
              `Unexpected audio response for reciter ${reciter.id}`
            );
          }

          const name = reciter.translated_name?.name ?? reciter.name ?? '';

          if (!name) {
            console.warn(
              `Skipping quran.foundation reciter ${reciter.id}: missing name`
            );
            results.push(null);
            continue;
          }

          const playlist: Playlist = [...audioData.audio_files]
            .sort((a, b) => a.chapter_id - b.chapter_id)
            .map((audioFile) => ({
              surahId: String(audioFile.chapter_id),
              link: audioFile.audio_url,
            }));

          const riwayaKey = riwayaKeyFromQirat(reciter.qirat?.name);

          results.push({
            id: `${LinkSource.QURAN_FOUNDATION}-${reciter.id}`,
            name,
            source: LinkSource.QURAN_FOUNDATION,
            moshaf: {
              id: String(reciter.id),
              name,
              riwaya: Riwaya[riwayaKey],
              server: '',
              surah_total: String(playlist.length),
              playlist,
            },
          } satisfies Reciter);
        } catch (error) {
          console.warn(
            `Skipping quran.foundation reciter ${reciter.id}:`,
            error
          );
          results.push(null);
        }
      }

      const reciters = results.filter((r): r is Reciter => r !== null);
      resultsCache.set(lang, {
        reciters,
        expiresAt: Date.now() + RESULTS_CACHE_TTL_MS,
      });
      return reciters;
    };

    const result = queue.then(run, run);
    queue = result.catch(() => {});
    return result;
  },
};
