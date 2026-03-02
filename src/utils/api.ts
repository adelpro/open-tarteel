import { LinkSource, LocaleType, MP3APIMoshaf, Reciter } from '@/types';
import { Playlist } from '@/types/playlist';

export const generatePlaylist = (moshaf: MP3APIMoshaf): Playlist => {
  const result = moshaf.surah_list.split(',').map((surahId: string) => ({
    surahId: surahId,
    link: `${moshaf.server}${surahId.padStart(3, '0')}.mp3`,
  }));
  return result;
};
// Function to fetch reciters from MP3Quran API
export async function getAllReciters(
  locale: LocaleType = 'ar',
  enabledSources?: LinkSource[] | null
): Promise<Reciter[]> {
  const isServer = globalThis.window === undefined;

  if (isServer) {
    const { getAllRecitersFromAdapters, parseEnabledSources } =
      await import('@/services/reciters');
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get('enabled-sources')?.value;
    const sources = enabledSources ?? parseEnabledSources(cookieValue);
    return getAllRecitersFromAdapters(locale, sources);
  }

  const language = locale === 'en' ? 'eng' : 'ar';
  const params = new URLSearchParams({ language });
  if (enabledSources && enabledSources.length > 0) {
    params.set('sources', enabledSources.join(','));
  }
  const response = await fetch(`/api/reciters?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch reciters: ${response.statusText}`);
  }

  return response.json() as Promise<Reciter[]>;
}

/**
 * Fetches a specific reciter by ID and moshaf ID.
 *
 * - Server-side: calls the service layer directly, using enabled-sources cookie when present.
 * - Client-side: calls the Next.js API route with sources in query (cookie is also sent).
 */
export async function getReciter(
  id: string,
  moshafId: string,
  locale: 'ar' | 'en' = 'ar',
  enabledSources?: LinkSource[] | null
): Promise<Reciter | null> {
  const isServer = globalThis.window === undefined;

  if (isServer) {
    const { getAllRecitersFromAdapters, parseEnabledSources } =
      await import('@/services/reciters');
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get('enabled-sources')?.value;
    const sources = enabledSources ?? parseEnabledSources(cookieValue);
    const reciters = await getAllRecitersFromAdapters(locale, sources);
    return (
      reciters.find((r) => r.id === id && r.moshaf.id === moshafId) ?? null
    );
  }

  const language = locale === 'en' ? 'eng' : 'ar';
  const params = new URLSearchParams({ language });
  if (enabledSources && enabledSources.length > 0) {
    params.set('sources', enabledSources.join(','));
  }
  const response = await fetch(
    `/api/reciters/${encodeURIComponent(id)}/${encodeURIComponent(moshafId)}?${params}`
  );

  if (!response.ok) return null;

  return response.json() as Promise<Reciter>;
}
