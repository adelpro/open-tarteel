import { atom } from 'jotai';

import type {
  DownloadProgress,
  OfflineErrorCode,
} from '@/services/offline/types';

export type OfflineState = {
  cachedUrls: Set<string>;
  progress: DownloadProgress | null;
  singleTrackLoading: string | null;
  singleTrackProgress: number;
  lastError: OfflineErrorCode;
  storagePersisted: boolean | null;
  hydrated: boolean;
};

export const offlineStateAtom = atom<OfflineState>({
  cachedUrls: new Set<string>(),
  progress: null,
  singleTrackLoading: null,
  singleTrackProgress: 0,
  lastError: null,
  storagePersisted: null,
  hydrated: false,
});
