import { LinkSource, Riwaya } from '@/types';

export type Reciter = {
  id: number;
  name: string;
  riwaya: Riwaya;
  playlist: string[];
  source: LinkSource;
  complet: boolean;
};
