'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import type { Language } from '@/constants/language';
import { localeFromPath } from '@/lib/seo/routes';

import ar from '../locales/ar.json';
import de from '../locales/de.json';
import en from '../locales/en.json';

const messages = { en, ar, de };

// Runs before paint on the client, and falls back to useEffect during SSR.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface Props {
  initialLocale?: Language;
  children: ReactNode;
}

/**
 * The URL is the language: bare paths are Arabic, `/en` is English, `/de` is
 * German. A stored preference must never change the document after hydration,
 * or a crawler and a visitor would read two different pages.
 *
 * During SSR `usePathname()` reports the rewrite destination (`/en` -> `/`), so
 * the first render uses the locale the middleware resolved. After hydration it
 * reports the browser URL, and the layout effect switches the document before
 * paint when the visitor navigates between locales.
 */
export default function IntlProviderWrapper({
  initialLocale = 'ar',
  children,
}: Props) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Language>(initialLocale);

  // `initialLocale` is the server truth for the first paint; only a pathname
  // change should switch it, so it is intentionally not a dependency.
  useIsomorphicLayoutEffect(() => {
    setLocale(localeFromPath(window.location.pathname));
  }, [pathname]);

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  );
}
