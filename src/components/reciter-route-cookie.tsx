'use client';

import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { selectedReciterAtom } from '@/jotai/atom';
import {
  RECITER_ROUTE_COOKIE,
  RECITER_ROUTE_MAX_AGE,
  reciterRouteFor,
} from '@/lib/reciter-route';

export function clearReciterRouteCookie() {
  document.cookie = `${RECITER_ROUTE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Mirrors the last selected reciter into a small cookie so the middleware can
 * send returning listeners straight to their player on the server, before the
 * home page or any client code runs.
 */
export default function ReciterRouteCookie() {
  const reciter = useAtomValue(selectedReciterAtom);

  useEffect(() => {
    if (!reciter) {
      clearReciterRouteCookie();
      return;
    }

    const value = encodeURIComponent(reciterRouteFor(reciter));
    document.cookie = `${RECITER_ROUTE_COOKIE}=${value}; path=/; max-age=${RECITER_ROUTE_MAX_AGE}; SameSite=Lax`;
  }, [reciter]);

  return null;
}
