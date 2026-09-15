'use client';

import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      // DevTools offline emulation can leave navigator.onLine as true while
      // the service worker serves cached documents.
      if (!navigator.serviceWorker?.controller) {
        setIsOnline(true);
        return;
      }

      try {
        await fetch(`/__offline-check__?t=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    const handleConnectivityChange = () => {
      void checkConnectivity();
    };

    void checkConnectivity();
    window.addEventListener('online', handleConnectivityChange);
    window.addEventListener('offline', handleConnectivityChange);

    return () => {
      window.removeEventListener('online', handleConnectivityChange);
      window.removeEventListener('offline', handleConnectivityChange);
    };
  }, []);

  return isOnline;
}
