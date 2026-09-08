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

const getQfEnvironmentVariable = (name: string): string | undefined => {
  switch (name) {
    case CLIENT_ID_ENV_VAR:
      return process.env.QURAN_FOUNDATION_CLIENT_ID ?? process.env.QF_CLIENT_ID;
    case CLIENT_SECRET_ENV_VAR:
      return (
        process.env.QURAN_FOUNDATION_CLIENT_SECRET ??
        process.env.QF_CLIENT_SECRET
      );
    case TOKEN_URL_ENV_VAR:
      return process.env.QURAN_FOUNDATION_TOKEN_URL;
    case API_BASE_ENV_VAR:
      return process.env.QURAN_FOUNDATION_API_BASE;
    case RATE_LIMIT_MS_ENV_VAR:
      return process.env.QURAN_FOUNDATION_RATE_LIMIT_MS;
    default:
      return undefined;
  }
};

const readEnvironment = (name: string): string => {
  const value = getQfEnvironmentVariable(name);
  if (!value) {
    throw new Error(
      `${name} is not set; quran.foundation provider is disabled`
    );
  }
  return value;
};

const rateLimitMs = (): number => {
  const override = Number(getQfEnvironmentVariable(RATE_LIMIT_MS_ENV_VAR));
  return Number.isFinite(override) && override >= 0
    ? override
    : DEFAULT_RATE_LIMIT_MS;
};

const noop = (): Promise<void> => Promise.resolve();

const fetchFreshToken = async (
  tokenUrl: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in?: number }> => {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  );
  let response: Response;
  try {
    response = await retryFetch(tokenUrl, 3, rateLimitMs() > 0 ? delay : noop, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: 'grant_type=client_credentials&scope=content',
    });
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
  return { access_token: data.access_token, expires_in: data.expires_in };
};

/** Exchanges client credentials for a fresh access token (cached hourly). */
const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientId = readEnvironment(CLIENT_ID_ENV_VAR);
  const clientSecret = readEnvironment(CLIENT_SECRET_ENV_VAR);
  const tokenUrl =
    getQfEnvironmentVariable(TOKEN_URL_ENV_VAR) ?? DEFAULT_TOKEN_URL;

  const data = await fetchFreshToken(tokenUrl, clientId, clientSecret);
  // Buffer 60s so the token is refreshed before it actually expires.
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };

  return data.access_token;
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
  reciter: QuranFoundationChapterRecitersResponse['reciters'][number],
  fetchWithThrottle: (_url: string) => Promise<Response>,
  apiBase: string
): Promise<Reciter | null> => {
  try {
    const audioResponse = await fetchWithThrottle(
      `${apiBase}${CHAPTER_AUDIO_PATH}/${reciter.id}`
    );
    const audioData: QuranFoundationChapterAudioResponse =
      await audioResponse.json();

    if (!Array.isArray(audioData.audio_files)) {
      throw new Error(`Unexpected audio response for reciter ${reciter.id}`);
    }

    const name = reciter.translated_name?.name ?? reciter.name;
    if (!name) {
      console.warn(
        `Skipping quran.foundation reciter ${reciter.id}: missing name`
      );
      return null;
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
    } satisfies Reciter;
  } catch (error) {
    console.warn(`Skipping quran.foundation reciter ${reciter.id}:`, error);
    return null;
  }
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

      const token = await getAccessToken();
      const clientId = readEnvironment(CLIENT_ID_ENV_VAR);
      const intervalMs = rateLimitMs();
      const backoff = intervalMs > 0 ? delay : noop;
      const apiBase =
        getQfEnvironmentVariable(API_BASE_ENV_VAR) ?? DEFAULT_API_BASE;

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

      const reciters: Reciter[] = [];
      for (const reciter of listData.reciters) {
        const item = await fetchSingleReciter(
          reciter,
          fetchWithThrottle,
          apiBase
        );
        if (item) {
          reciters.push(item);
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
