import { MagnetlinkSource, Riwaya } from '@/types';

export type Reciter = {
  id: number;
  name: string;
  riwaya: Riwaya;
  magnet: string;
  source: MagnetlinkSource;
  complet: boolean;
};
