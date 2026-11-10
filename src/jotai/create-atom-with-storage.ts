'use client';

import { atomWithStorage } from 'jotai/utils';

import { createStorage } from '@/utils/storage/create-storage';

type Options<T> = {
  getOnInit?: boolean;
  /** Reject persisted values whose shape no longer matches the type. */
  validate?: (value: unknown) => value is T;
};

export function createAtomWithStorage<T>(
  key: string,
  initialValue: T,
  options?: Options<T>
) {
  return atomWithStorage<T>(
    key,
    initialValue,
    createStorage<T>(options?.validate),
    options?.getOnInit ? { getOnInit: true } : undefined
  );
}
