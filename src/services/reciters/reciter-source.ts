import { Reciter } from '@/types';

export type ReciterSource = {
  readonly source: string;
  getReciters(lang: 'ar' | 'en' | 'de'): Promise<Reciter[]>;
};
