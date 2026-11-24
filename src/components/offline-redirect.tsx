'use client';

import { useAtomValue } from 'jotai';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useNetworkStatusDetails } from '@/hooks/use-network-status';
import { offlineModeAtom } from '@/jotai/offline-mode';
import {
  localeFromPath,
  type SeoLocale,
  stripLocale,
  withLocale,
} from '@/lib/seo/routes';

export default function OfflineRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const offlineMode = useAtomValue(offlineModeAtom);
  // `ready` guards the mount effect: useNetworkStatus seeds `online` to true
  // for SSR/hydration, so redirecting on the first render could bounce a
  // genuinely-offline user off the /offline shell before the probe settles.
  const { online, ready } = useNetworkStatusDetails();
  const barePath = stripLocale(pathname);
  const pathLocale = localeFromPath(pathname);
  const lang =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('lang');
  const resolvedLocale: SeoLocale =
    pathLocale !== 'ar'
      ? pathLocale
      : lang === 'en' || lang === 'de'
        ? lang
        : 'ar';
  const homePath = withLocale(resolvedLocale, '/');

  useEffect(() => {
    let cancelled = false;

    const redirectWhenBackOnline = () => {
      // Only handle returning to home when on the /offline fallback page.
      // Forced-offline mode keeps the user on the fallback even when the
      // network is genuinely back.
      if (barePath !== '/offline' || cancelled || offlineMode === 'on') return;
      if (!ready || !online) return;

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
  }, [barePath, homePath, router, offlineMode, online, ready]);

  return null;
}
