import { Reciter } from '@/types';

export const generateFavId = (reciter: Reciter): string => {
  const favId = `${reciter.id}-${reciter.moshaf.id}`;
  return favId;
};
