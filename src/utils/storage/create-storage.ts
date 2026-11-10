'use client';

import { createJSONStorage } from 'jotai/utils';

const storage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

/**
 * JSON storage with an optional shape guard. A persisted value that no longer
 * matches the current type is treated as absent instead of crashing the
 * components that read it.
 */
export function createStorage<T>(isValid?: (value: unknown) => value is T) {
  const jsonStorage = createJSONStorage<T>(() => storage);

  if (!isValid) return jsonStorage;

  return {
    ...jsonStorage,
    getItem: (key: string, initialValue: T): T => {
      const value = jsonStorage.getItem(key, initialValue);
      return isValid(value) ? value : initialValue;
    },
  };
}
