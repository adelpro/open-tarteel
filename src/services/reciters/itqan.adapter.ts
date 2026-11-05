import type { Language } from '@/constants/language';
import type { Playlist, Reciter } from '@/types';
import { LinkSource, Riwaya } from '@/types';
import { getRiwayaKeyFromMoshafName } from '@/utils/get-riwaya-from-mushaf';

import type {
  ItqanRecitationDetailResponse,
  ItqanRecitationResponse,
  ItqanSurah,
} from './itqan.types';
import type { ReciterSource } from './reciter-source';

const BASE_URL = 'https://api.cms.itqan.dev';
const LIST_PAGE_SIZE = 100;
const TRACK_PAGE_SIZE = 200;

const buildHeaders = (lang: Language): Record<string, string> => {
  // Itqan localizes via `Accept-Language` (ar|en). German falls back to English
  // until the provider adds it.
  const headers: Record<string, string> = {
    'Accept-Language': lang === 'ar' ? 'ar' : 'en',
    'X-Client-Name': 'open-tarteel',
  };

  // Optional server-only key: public endpoints work without it, but the key
  // raises limits and identifies the app in `X-Itqan-App`.
  const apiKey = process.env.ITQAN_API_KEY;
  if (apiKey) headers['X-API-Key'] = apiKey;

  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  if (version && version !== 'N/A') headers['X-Client-Version'] = version;

  return headers;
};

interface ItqanPage<T> {
  count: number;
  results: T[];
}

const fetchAllPages = async <T>(
  path: string,
  lang: Language,
  pageSize: number
): Promise<T[]> => {
  const headers = buildHeaders(lang);
  const items: T[] = [];
  let page = 1;

  for (;;) {
    const response = await fetch(
      `${BASE_URL}${path}?page=${page}&page_size=${pageSize}`,
      { headers }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch Itqan ${path} (${response.status})`);
    }

    const data = (await response.json()) as ItqanPage<T>;
    if (!Array.isArray(data.results)) {
      throw new Error(`Unexpected Itqan response for ${path}`);
    }

    items.push(...data.results);
    if (items.length >= data.count || data.results.length === 0) break;
    page += 1;
  }

  return items;
};

export const ItqanAdapter = {
  source: LinkSource.ITQAN,

  async getReciters(lang: Language): Promise<Reciter[]> {
    // The list is paginated (20 per page by default). Fetch all pages so no
    // recitation is silently dropped.
    const recitations = await fetchAllPages<
      ItqanRecitationResponse['results'][number]
    >('/recitations/', lang, LIST_PAGE_SIZE);

    return recitations.map((recitation) => {
      const riwayaKey = getRiwayaKeyFromMoshafName(
        recitation.riwayah?.name ?? 'Hafs',
        lang
      );

      return {
        id: `${LinkSource.ITQAN}-${recitation.reciter.id}`,
        name: recitation.reciter.name,
        source: LinkSource.ITQAN,
        moshaf: {
          id: String(recitation.id),
          name: recitation.name,
          riwaya: Riwaya[riwayaKey],
          server: '',
          surah_total: String(recitation.surahs_count),
          // The track list (114 items, ~555 KB) is loaded on demand by
          // `getPlaylist` so the catalog stays small.
          playlist: [],
        },
      } satisfies Reciter;
    });
  },

  async getPlaylist(moshafId: string, lang: Language): Promise<Playlist> {
    const tracks = await fetchAllPages<ItqanSurah>(
      `/recitations/${moshafId}`,
      lang,
      TRACK_PAGE_SIZE
    );

    return tracks
      .sort((a, b) => a.surah_number - b.surah_number)
      .map((track) => ({
        surahId: String(track.surah_number),
        // Keep the `c=<app-slug>` query parameter: Itqan uses it for usage
        // accounting, and the URL is otherwise already absolute.
        link: track.audio_url,
      }));
  },
} satisfies ReciterSource;

// Re-export for type-only consumers and tests.
export type { ItqanRecitationDetailResponse };
