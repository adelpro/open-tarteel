'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import { isEffectivelyOffline, offlineModeAtom } from '@/jotai/offline-mode';

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
// Auto mode only flips to offline after two consecutive failed probes. A single
// success clears the streak, so a blip on a flaky connection cannot change the UI.
let failedChecks = 0;
let wired = false;
let detachWindowListeners: (() => void) | null = null;

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
        failedChecks = 2;
        emit(false);
        return;
      }
      // Without an active service worker there is no cached document to be
      // fooled by: the browser's own flag is the truth.
      if (
        typeof navigator === 'undefined' ||
        !navigator.serviceWorker?.controller
      ) {
        failedChecks = 0;
        emit(true);
        return;
      }
      const response = await fetch(`/offline-check?t=${now}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (response.ok) {
        failedChecks = 0;
        emit(true);
      } else {
        failedChecks += 1;
        if (failedChecks >= 2) emit(false);
      }
    } catch {
      failedChecks += 1;
      if (failedChecks >= 2) emit(false);
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
  detachWindowListeners = () => {
    window.removeEventListener('online', sync);
    window.removeEventListener('offline', sync);
  };
}

export function retryConnectivityCheck(): Promise<void> {
  return check(true);
}

export function resetNetworkStatusForTests(): void {
  detachWindowListeners?.();
  detachWindowListeners = null;
  listeners.clear();
  online = true;
  inFlight = null;
  lastCheck = 0;
  failedChecks = 0;
  wired = false;
}

export function useNetworkStatus() {
  const mode = useAtomValue(offlineModeAtom);
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
    void check(true);
  }, [mode]);

  return !isEffectivelyOffline(mode, isOnline);
}
