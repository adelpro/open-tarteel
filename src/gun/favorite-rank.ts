import Gun from 'gun';

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
});

const FAVORITE_COUNTS_KEY = 'favoriteCounts';
const favoriteCountsNode = gun.get(FAVORITE_COUNTS_KEY);

/**
 * Fetch all favorite counts once (snapshot), no timeout needed.
 */
export function fetchFavoriteCounts(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const counts: Record<string, number> = {};
    let pending = 0;

    favoriteCountsNode.map().once((count, key) => {
      if (!key || typeof count !== 'number') return;

      pending++;
      counts[key] = count;

      // Short delay to wait for all keys to arrive
      clearTimeout(timeout);
      timeout = setTimeout(() => resolve({ ...counts }), 300);
    });

    let timeout = setTimeout(() => resolve({ ...counts }), 1000); // fallback
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
