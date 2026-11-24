import type { Language } from '@/constants/language';

export const RECITER_ROUTE_COOKIE = 'reciter-route';
export const RECITER_ROUTE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * The canonical player route for a reciter. Reciter documents live at bare
 * Arabic URLs, so the interface language travels in a query parameter; the
 * client provider reads it after hydration without changing SEO metadata.
 */
export const reciterRouteFor = (
  reciter: {
    id: string;
    moshaf: { id: string };
  },
  locale?: Language
): string => {
  const path = `/reciter/${encodeURIComponent(reciter.id)}?moshafId=${encodeURIComponent(
    reciter.moshaf.id
  )}`;
  return locale && locale !== 'ar' ? `${path}&lang=${locale}` : path;
};

/**
 * Cookie values come from the browser, so only accept a same-origin reciter
 * route with a supported interface locale. Rejects protocols, double slashes
 * and anything outside `/reciter/`.
 */
export const isReciterRoute = (value: string): boolean =>
  /^\/reciter\/[^/?#]+\?moshafId=[^/?#&]+(?:&lang=(?:en|de))?$/.test(value);
