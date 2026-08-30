'use client';

import { useAtomValue } from 'jotai';
import { ReactNode, useEffect } from 'react';
import { IntlProvider } from 'react-intl';

import { localeAtom } from '@/jotai/atom';

import ar from '../locales/ar.json';
import en from '../locales/en.json';

const messages = { en, ar };
const COOKIE_NAME = 'locale';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface Props {
  initialLocale?: 'ar' | 'en';
  children: ReactNode;
}

export default function IntlProviderWrapper({
  initialLocale = 'ar',
  children,
}: Props) {
  const storedLocale = useAtomValue(localeAtom);
  const locale = typeof window === 'undefined' ? initialLocale : storedLocale;

  // Sync cookie whenever locale is set or changed
  useEffect(() => {
    document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  }, [locale]);

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  );
}
