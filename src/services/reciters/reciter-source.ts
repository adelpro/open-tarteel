import { Language } from '@/constants/language';
import { Reciter } from '@/types';

export type ReciterSource = {
  readonly source: string;
  getReciters(lang: Language): Promise<Reciter[]>;
};
