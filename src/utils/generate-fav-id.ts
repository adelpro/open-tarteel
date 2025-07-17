import { Reciter } from '@/types';

export const generateFavId = (reciter: Reciter): string => {
  if (!reciter.moshaf) {
    throw new Error(`Missing moshaf for reciter ${reciter.id}`);
  }

  return `${reciter.id}-${reciter.moshaf.id}`;
};
