'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

import type { Language } from '@/constants/language';
import { localeFromPath } from '@/lib/seo/routes';

import ar from '../locales/ar.json';
import de from '../locales/de.json';
import en from '../locales/en.json';

const messages = { en, ar, de };

interface Props {
  initialLocale?: Language;
  children: ReactNode;
}

/**
 * The URL is the language: bare paths are Arabic, `/en` is English, `/de` is
 * German. A stored preference must never change the document after hydration,
 * or a crawler and a visitor would read two different pages.
 */
export default function IntlProviderWrapper({
  initialLocale = 'ar',
  children,
}: Props) {
  const pathname = usePathname();
  const locale = pathname ? localeFromPath(pathname) : initialLocale;

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  );
}
