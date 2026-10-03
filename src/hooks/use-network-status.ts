'use client';

import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  // The first render must be identical on the server and in the browser.
  // `navigator.onLine` is undefined during SSR, so reading it here would make
  // the server render the offline banner while an online client renders
  // nothing, which throws a hydration mismatch. Start optimistic (no banner)
  // and let the mount effect below correct it from the real browser state.
  const [isOnline, setIsOnline] = useState(true);

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
