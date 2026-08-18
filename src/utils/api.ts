import { Language } from '@/constants/language';
import type { LinkSource, Reciter } from '@/types';

export async function getAllReciters(
  locale: Language = 'ar',
  enabledSources: LinkSource[] | null = null
): Promise<Reciter[]> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const { getAllRecitersFromAdapters } = await import('@/services/reciters');
    return getAllRecitersFromAdapters(locale, enabledSources);
  }

  const language: Language = locale;
  const params = new URLSearchParams({ language });
  if (enabledSources && enabledSources.length > 0) {
    params.set('sources', enabledSources.join(','));
  }
  const response = await fetch(`/api/reciters?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reciters: ${response.statusText}`);
  }

  return response.json() as Promise<Reciter[]>;
}

export async function getReciter(
  id: string,
  moshafId: string,
  locale: Language = 'ar',
  enabledSources: LinkSource[] | null = null
): Promise<Reciter | undefined> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const { getAllRecitersFromAdapters } = await import('@/services/reciters');
    const reciters = await getAllRecitersFromAdapters(locale, enabledSources);
    return reciters.find((r) => r.id === id && r.moshaf.id === moshafId);
  }

  const params = new URLSearchParams({ language: locale });
  if (enabledSources && enabledSources.length > 0) {
    params.set('sources', enabledSources.join(','));
  }
  const response = await fetch(
    `/api/reciters/${encodeURIComponent(id)}/${encodeURIComponent(moshafId)}?${params}`,
    {
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!response.ok) return undefined;

  return response.json() as Promise<Reciter>;
}
