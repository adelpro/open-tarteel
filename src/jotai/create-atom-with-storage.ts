import { atomWithStorage } from 'jotai/utils';

import { createStorage } from '@/utils/storage/create-storage';

export function createAtomWithStorage<T>(key: string, initialValue: T) {
  return atomWithStorage<T>(key, initialValue, createStorage<T>(), {
    getOnInit: true,
  });
}
