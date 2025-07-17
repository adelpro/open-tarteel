import { Reciter } from '@/types';

export const generateFavId = (reciter: Reciter): string => {
  return `${reciter.id}-${reciter.moshaf.id}`;
};
