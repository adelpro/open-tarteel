import Gun from 'gun';

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'], // replace with your relay URLs
});

const favoriteCountsNode = gun.get('favoriteCounts');
const FAVORITE_COUNTS_KEY = 'favoriteCounts';

export async function fetchFavoriteCounts(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const temporary: Record<string, number> = {};
    favoriteCountsNode.map().once((count, key) => {
      if (!key || typeof count !== 'number') return;
      temporary[key] = count;
    });
    setTimeout(() => resolve(temporary), 1000); // collect initial values for 1sec
  });
}

export function subscribeToFavoriteCounts(
  callback: (counts: Record<string, number>) => void
): () => void {
  const counts: Record<string, number> = {};

  // Handler for individual favorite count updates
  const onUpdate = (count: number, key: string) => {
    if (!key || typeof count !== 'number') return;
    counts[key] = count;
    callback({ ...counts });
  };

  // Subscribe to all favorite counts changes
  favoriteCountsNode.map().on(onUpdate);

  // Return unsubscribe function
  return () => {
    favoriteCountsNode.map().off();
  };
}

/**
 * Sync favorite state globally
 * @param id reciterId-moshafId
 * @param isFavorited whether user just added or removed it
 */
export function syncFavorite(id: string, isFavorited: boolean) {
  const ref = gun.get(FAVORITE_COUNTS_KEY).get(id);

  ref.once((currentCount: number = 0) => {
    let updated = currentCount;

    if (isFavorited) updated += 1;
    else updated = Math.max(0, currentCount - 1);

    ref.put(updated);
  });
}
