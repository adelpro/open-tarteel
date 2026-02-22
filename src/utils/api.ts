import type { LinkSource, Reciter } from '@/types';

/**
 * Fetches all reciters.
 *
 * - Server-side: calls the service layer directly, using enabled-sources cookie when present.
 * - Client-side: calls the Next.js API route with sources in query (cookie is also sent).
 */
export async function getAllReciters(
  locale: 'ar' | 'en' = 'ar',
  enabledSources?: LinkSource[] | null
): Promise<Reciter[]> {
  const isServer = typeof window === 'undefined';

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
): Promise<Reciter | undefined> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const { getAllRecitersFromAdapters, parseEnabledSources } =
      await import('@/services/reciters');
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get('enabled-sources')?.value;
    const sources = enabledSources ?? parseEnabledSources(cookieValue);
    const reciters = await getAllRecitersFromAdapters(locale, sources);
    return reciters.find((r) => r.id === id && r.moshaf.id === moshafId);
  }

  const language = locale === 'en' ? 'eng' : 'ar';
  const params = new URLSearchParams({ language });
  if (enabledSources && enabledSources.length > 0) {
    params.set('sources', enabledSources.join(','));
  }
  const response = await fetch(
    `/api/reciters/${encodeURIComponent(id)}/${encodeURIComponent(moshafId)}?${params}`
  );

  if (!response.ok) return undefined;

  return response.json() as Promise<Reciter>;
}
