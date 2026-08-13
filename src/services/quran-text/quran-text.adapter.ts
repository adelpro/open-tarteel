import type { SurahText } from '@/types';

const BASE_URL = 'https://api.alquran.cloud/v1';

export const DEFAULT_TEXT_EDITION = 'quran-uthmani';

export type TextEdition = 'quran-uthmani' | 'quran-simple';

/**
 * Fetches surah text directly from alquran.cloud (server-side only).
 * The client should go through `getSurahText` which uses the proxied
 * `/api/surah/{id}` route.
 */
export async function fetchSurahText(
  surahId: number,
  edition: TextEdition = DEFAULT_TEXT_EDITION
): Promise<SurahText> {
  const response = await fetch(`${BASE_URL}/surah/${surahId}/${edition}`, {
    next: { revalidate: 31536000 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch surah ${surahId}: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data as SurahText;
}
