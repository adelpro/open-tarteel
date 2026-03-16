'use client';

import { useCallback } from 'react';

import { clearRecitersCache } from '@/utils/cache';

/**
 * Hook for managing reciters cache
 *
 * Provides utilities to manually clear cache when needed
 */
export function useRecitersCache() {
  const clearCache = useCallback(() => {
    clearRecitersCache();
  }, []);

  return {
    clearCache,
  };
}
