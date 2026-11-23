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
type Status = { online: boolean; ready: boolean };
type Listener = (status: Status) => void;

const INITIAL_STATUS: Status = { online: true, ready: false };

const listeners = new Set<Listener>();
let status: Status = INITIAL_STATUS;
let inFlight: Promise<void> | null = null;
let lastCheck = 0;
// Auto mode only flips to offline after two consecutive failed probes. A single
// success clears the streak, so a blip on a flaky connection cannot change the UI.
let failedChecks = 0;
let wired = false;
let detachWindowListeners: (() => void) | null = null;

function publish(next: Status) {
  if (next.online === status.online && next.ready === status.ready) return;
  status = next;
  for (const listener of listeners) listener(status);
}

function setOnline(online: boolean) {
  publish({ ...status, online });
}

function markReady() {
  publish({ ...status, ready: true });
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
        setOnline(false);
        return;
      }
      // Without an active service worker there is no cached document to be
      // fooled by: the browser's own flag is the truth.
      if (
        typeof navigator === 'undefined' ||
        !navigator.serviceWorker?.controller
      ) {
        failedChecks = 0;
        setOnline(true);
        return;
      }
      const response = await fetch(`/offline-check?t=${now}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (response.ok) {
        failedChecks = 0;
        setOnline(true);
      } else {
        failedChecks += 1;
        if (failedChecks >= 2) setOnline(false);
      }
    } catch {
      failedChecks += 1;
      if (failedChecks >= 2) setOnline(false);
    } finally {
      // Every settled probe — including the immediate navigator/no-SW paths —
      // makes the connectivity answer trustworthy for late-mounting consumers.
      markReady();
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
    setOnline(navigator.onLine);
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
  status = { ...INITIAL_STATUS };
  inFlight = null;
  lastCheck = 0;
  failedChecks = 0;
  wired = false;
}

function useStatus(): Status {
  // The first render must be identical on the server and in the browser.
  // In particular it must not trust navigator.onLine or a module-level value
  // left over from an earlier check, so hydration cannot diverge.
  const [current, setCurrent] = useState<Status>(INITIAL_STATUS);

  useEffect(() => {
    wire();
    const unsubscribe = subscribe(setCurrent);
    // Adopt the shared, already-settled answer if another consumer probed
    // first; the first render above stays SSR-safe because ready starts false.
    setCurrent(status);
    void check();
    return unsubscribe;
  }, []);

  return current;
}

/** Connectivity plus a flag telling consumers whether the first probe settled. */
export function useNetworkStatusDetails(): Status {
  return useStatus();
}

export function useNetworkStatus() {
  const mode = useAtomValue(offlineModeAtom);
  const { online } = useStatus();

  useEffect(() => {
    void check(true);
  }, [mode]);

  return !isEffectivelyOffline(mode, online);
}
