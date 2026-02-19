import type { Reciter } from '@/types';

/**
 * Fetches all reciters.
 *
 * - Server-side: calls the service layer directly (no network hop).
 * - Client-side: calls the Next.js API route which uses the same service layer.
 */
export async function getAllReciters(
  locale: 'ar' | 'en' = 'ar'
): Promise<Reciter[]> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const { getAllRecitersFromAdapters } = await import('@/services/reciters');
    return getAllRecitersFromAdapters(locale);
  }

  const language = locale === 'en' ? 'eng' : 'ar';
  const response = await fetch(`/api/reciters?language=${language}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch reciters: ${response.statusText}`);
  }

  return response.json() as Promise<Reciter[]>;
}

/**
 * Fetches a specific reciter by ID and moshaf ID.
 *
 * - Server-side: calls the service layer directly.
 * - Client-side: calls the Next.js API route.
 */
export async function getReciter(
  id: string,
  moshafId: string,
  locale: 'ar' | 'en' = 'ar'
): Promise<Reciter | undefined> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const { getAllRecitersFromAdapters } = await import('@/services/reciters');
    const reciters = await getAllRecitersFromAdapters(locale);
    return reciters.find((r) => r.id === id && r.moshaf.id === moshafId);
  }

  const language = locale === 'en' ? 'eng' : 'ar';
  const response = await fetch(
    `/api/reciters/${encodeURIComponent(id)}/${encodeURIComponent(moshafId)}?language=${language}`
  );

  if (!response.ok) return undefined;

  return response.json() as Promise<Reciter>;
}
