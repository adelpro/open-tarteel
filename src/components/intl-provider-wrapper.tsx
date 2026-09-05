'use client';

import { useAtomValue } from 'jotai';
import { ReactNode, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import type { Language } from '@/constants/language';
import { localeAtom } from '@/jotai/atom';

import ar from '../locales/ar.json';
import de from '../locales/de.json';
import en from '../locales/en.json';
const messages = { en, ar, de };
const COOKIE_NAME = 'locale';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface Props {
  initialLocale?: Language;
  children: ReactNode;
}

export default function IntlProviderWrapper({
  initialLocale = 'ar',
  children,
}: Props) {
  const storedLocale = useAtomValue(localeAtom);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const locale = isHydrated ? storedLocale : initialLocale;

  // Sync cookie whenever locale is set or changed
  useEffect(() => {
    if (!isHydrated) return;

    document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  }, [isHydrated, locale]);

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  );
}
