import { APP_STORAGE_KEYS } from '@/utils/storage/storage-keys';

/**
 * The favourites this browser holds, read straight from storage.
 *
 * Not from `favoriteRecitersAtom`: it is an `atomWithStorage` without
 * `getOnInit`, so until something mounts it the atom reads `[]`. A union taken
 * against that `[]` would look like "no local favourites" and drop the ones the
 * listener made while signed out.
 */
export function readLocalFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEYS.favorites);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

/** The ids the account's `favorites` node marks `true`. Gun's `_` is metadata. */
export function remoteFavoriteIds(remote: unknown): string[] {
  if (!remote || typeof remote !== 'object') return [];
  return Object.entries(remote as Record<string, unknown>)
    .filter(([key, value]) => key !== '_' && value === true)
    .map(([key]) => key);
}

/**
 * Union, never replace: favourites made while signed out, or on this device
 * while the relay was unreachable, survive the first sign-in.
 *
 * `missing` are the local ids the account does not have yet; the caller writes
 * them up so every other device in the ring receives them.
 */
export function mergeFavorites(
  local: string[],
  remote: unknown
): { merged: string[]; missing: string[] } {
  const remoteIds = remoteFavoriteIds(remote);
  const merged = [...new Set([...local, ...remoteIds])];
  const known = new Set(remoteIds);
  return { merged, missing: merged.filter((id) => !known.has(id)) };
}
