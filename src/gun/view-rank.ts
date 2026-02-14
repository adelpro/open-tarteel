'use client';
import Gun from 'gun/gun';

import { GUNCONFIG, VIEW_COUNTS_KEY } from '@/constants';

const gun = Gun(GUNCONFIG);

const viewCountsNode = gun.get(VIEW_COUNTS_KEY);

export async function fetchViewCounts(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const temporary: Record<string, number> = {};
    viewCountsNode.map().once((count, key) => {
      if (!key || typeof count !== 'number') return;
      temporary[key] = count;
    });
    setTimeout(() => resolve(temporary), 1000); // buffer reads
  });
}

export function subscribeToViewCounts(
  callback: (counts: Record<string, number>) => void
): () => void {
  const counts: Record<string, number> = {};

  viewCountsNode.map().on((count, key) => {
    if (!key || typeof count !== 'number') return;
    counts[key] = count;
    callback({ ...counts });
  });

  return () => {
    viewCountsNode.map().off();
  };
}

export function syncView(id: string) {
  const ref = viewCountsNode.get(id);

  ref.once((currentCount: number = 0) => {
    ref.put(currentCount + 1);
  });
}
