'use client';

import { useAtomValue } from 'jotai';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { offlineModeAtom } from '@/jotai/offline-mode';
import { localeFromPath, stripLocale, withLocale } from '@/lib/seo/routes';

export default function OfflineRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const offlineMode = useAtomValue(offlineModeAtom);
  // The same derived "effectively online" value the downloads-only UI uses.
  // A second, independent probe here could contradict the hook on a captive
  // portal and bounce a still-offline user off the /offline shell.
  const isOnline = useNetworkStatus();
  const barePath = stripLocale(pathname);
  const homePath = withLocale(localeFromPath(pathname), '/');

  useEffect(() => {
    let cancelled = false;

    const redirectWhenBackOnline = () => {
      // Only handle returning to home when on the /offline fallback page.
      // Forced-offline mode keeps the user on the fallback even when the
      // network is genuinely back.
      if (barePath !== '/offline' || cancelled || offlineMode === 'on') return;
      if (!isOnline) return;

      if (stripLocale(window.location.pathname) === '/offline') {
        router.replace(homePath);
      }
    };

    if (barePath === '/offline') {
      redirectWhenBackOnline();
      window.addEventListener('online', redirectWhenBackOnline);
      window.addEventListener('focus', redirectWhenBackOnline);
      const intervalId = window.setInterval(redirectWhenBackOnline, 10_000);

      return () => {
        cancelled = true;
        window.removeEventListener('online', redirectWhenBackOnline);
        window.removeEventListener('focus', redirectWhenBackOnline);
        window.clearInterval(intervalId);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [barePath, homePath, router, offlineMode, isOnline]);

  return null;
}
