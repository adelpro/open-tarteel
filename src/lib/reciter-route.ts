export const RECITER_ROUTE_COOKIE = 'reciter-route';
export const RECITER_ROUTE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** The canonical player route for a reciter. */
export const reciterRouteFor = (reciter: {
  id: string;
  moshaf: { id: string };
}): string =>
  `/reciter/${encodeURIComponent(reciter.id)}?moshafId=${encodeURIComponent(
    reciter.moshaf.id
  )}`;

/**
 * Cookie values come from the browser, so only accept a same-origin reciter
 * route. Rejects protocols, double slashes and anything outside `/reciter/`.
 */
export const isReciterRoute = (value: string): boolean =>
  /^\/reciter\/[^/?#]+\?moshafId=[^/?#]+$/.test(value);
