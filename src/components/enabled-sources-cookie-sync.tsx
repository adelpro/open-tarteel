'use client';

import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { enabledSourcesAtom } from '@/jotai/atom';

const COOKIE_NAME = 'enabled-sources';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Syncs enabledSourcesAtom to an `enabled-sources` cookie so server-side
 * code (API routes, generateMetadata, etc.) can respect the user's source
 * preferences without a network round-trip.
 */
export function EnabledSourcesCookieSync() {
  const enabledSources = useAtomValue(enabledSourcesAtom);

  useEffect(() => {
    const value = enabledSources.join(',');
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  }, [enabledSources]);

  return null;
}
