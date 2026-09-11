'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const CONNECTIVITY_CHECK_URL = 'https://www.gstatic.com/generate_204';

export default function OfflineRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let redirecting = false;

    if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker
        .getRegistrations()
        .then(async (registrations) => {
          const removed = await Promise.all(
            registrations.map((registration) => registration.unregister())
          );
          if (removed.some(Boolean) && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
    }

    const redirectToOffline = () => {
      if (cancelled || redirecting || window.location.pathname === '/offline') {
        return;
      }

      redirecting = true;
      window.location.replace('/offline');
    };

    const redirectToHome = () => {
      if (cancelled || redirecting || window.location.pathname !== '/offline') {
        return;
      }

      redirecting = true;
      window.location.replace('/');
    };

    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        if (pathname !== '/offline') redirectToOffline();
        return;
      }

      try {
        await fetch(`${CONNECTIVITY_CHECK_URL}?t=${Date.now()}`, {
          cache: 'no-store',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000),
        });
        if (pathname === '/offline') redirectToHome();
      } catch {
        if (pathname !== '/offline') redirectToOffline();
      }
    };

    void checkConnectivity();
    window.addEventListener('offline', checkConnectivity);
    window.addEventListener('focus', checkConnectivity);
    const intervalId = window.setInterval(checkConnectivity, 10_000);

    return () => {
      cancelled = true;
      window.removeEventListener('offline', checkConnectivity);
      window.removeEventListener('focus', checkConnectivity);
      window.clearInterval(intervalId);
    };
  }, [pathname]);

  return null;
}
