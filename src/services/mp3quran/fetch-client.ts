const BASE_URL = 'https://mp3quran.net/api/v3';
const REVALIDATE_TIME = 3600; // 1 hour in seconds

export async function mp3Fetch<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: REVALIDATE_TIME },
  });

  if (!response.ok) throw new Error(`MP3Quran API Error: ${response.status}`);

  return response.json();
}

export type SupportedLanguage =
  | 'ar'
  | 'eng'
  | 'fr'
  | 'ru'
  | 'de'
  | 'es'
  | 'tr'
  | 'cn'
  | 'th'
  | 'ur'
  | 'bn'
  | 'bs'
  | 'ug'
  | 'fa'
  | 'tg'
  | 'ml'
  | 'tl'
  | 'id'
  | 'pt'
  | 'ha'
  | 'sw';
