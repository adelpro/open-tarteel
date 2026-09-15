'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const CONNECTIVITY_CHECK_URL = 'https://www.gstatic.com/generate_204';

export default function OfflineRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const checkConnectivity = async () => {
      // Only handle returning to home when on the /offline fallback page
      if (pathname !== '/offline' || cancelled) return;

      if (!navigator.onLine) return;

      try {
        await fetch(`${CONNECTIVITY_CHECK_URL}?t=${Date.now()}`, {
          cache: 'no-store',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000),
        });
        if (!cancelled && window.location.pathname === '/offline') {
          router.replace('/');
        }
      } catch {
        // Still offline
      }
    };

    if (pathname === '/offline') {
      void checkConnectivity();
      window.addEventListener('online', checkConnectivity);
      window.addEventListener('focus', checkConnectivity);
      const intervalId = window.setInterval(checkConnectivity, 10_000);

      return () => {
        cancelled = true;
        window.removeEventListener('online', checkConnectivity);
        window.removeEventListener('focus', checkConnectivity);
        window.clearInterval(intervalId);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
