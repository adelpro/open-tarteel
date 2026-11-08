'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import { forcedOfflineAtom } from '@/jotai/atom';

/**
 * One connectivity probe shared by every consumer. The hook used to run its own
 * fetch in each component, so a screen with five consumers fired five requests
 * on mount and again on every remount. The store dedupes in-flight and recent
 * checks and keeps a single pair of window listeners.
 */
type Listener = (online: boolean) => void;

const listeners = new Set<Listener>();
let online = true;
let inFlight: Promise<void> | null = null;
let lastCheck = 0;
let wired = false;

function emit(next: boolean) {
  if (next === online) return;
  online = next;
  for (const listener of listeners) listener(next);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function check(force = false) {
  if (inFlight) return inFlight;

  const now = Date.now();
  if (!force && now - lastCheck < 10_000) return;

  lastCheck = now;
  inFlight = (async () => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        emit(false);
        return;
      }
      // Without an active service worker there is no cached document to be
      // fooled by: the browser's own flag is the truth.
      if (!navigator.serviceWorker?.controller) {
        emit(true);
        return;
      }
      const response = await fetch(`/offline-check?t=${now}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      emit(response.ok);
    } catch {
      emit(false);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

function wire() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  const sync = () => {
    lastCheck = 0;
    emit(navigator.onLine);
    void check(true);
  };
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
}

export function useNetworkStatus() {
  const forcedOffline = useAtomValue(forcedOfflineAtom);
  // The first render must be identical on the server and in the browser.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    wire();
    const unsubscribe = subscribe(setIsOnline);
    setIsOnline(navigator.onLine);
    void check();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!forcedOffline) void check(true);
  }, [forcedOffline]);

  return forcedOffline ? false : isOnline;
}
