import Gun from 'gun';

import { FAVORITE_COUNTS_KEY, GUN_PEERS } from '@/constants';

const gun = Gun({
  peers: [GUN_PEERS],
  radisk: false,
});

const favoriteCountsNode = gun.get(FAVORITE_COUNTS_KEY);

/**
 * Fetch all favorite counts once (snapshot), no timeout needed.
 */
export function fetchFavoriteCounts(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const counts: Record<string, number> = {};
    let timeout = setTimeout(() => resolve({ ...counts }), 1000);

    favoriteCountsNode.map().once((count, key) => {
      if (!key || typeof count !== 'number') return;

      counts[key] = count;

      clearTimeout(timeout);
      timeout = setTimeout(() => resolve({ ...counts }), 300);
    });
  });
}

/**
 * Subscribe to global favorite count updates in real time.
 */
export function subscribeToFavoriteCounts(
  callback: (counts: Record<string, number>) => void
): () => void {
  const counts: Record<string, number> = {};

  const onUpdate = (count: number, key: string) => {
    if (!key || typeof count !== 'number') return;
    counts[key] = count;
    callback({ ...counts });
  };

  favoriteCountsNode.map().on(onUpdate);

  return () => favoriteCountsNode.map().off();
}

/**
 * Sync favorite toggle state with Gun
 */
export function syncFavorite(id: string, isFavorited: boolean): void {
  const ref = favoriteCountsNode.get(id);
  ref.once((currentCount: number = 0) => {
    const updated = isFavorited
      ? currentCount + 1
      : Math.max(0, currentCount - 1);
    ref.put(updated);
  });
}
