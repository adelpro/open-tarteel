'use client';

import { useAtomValue } from 'jotai';
import { ReactNode, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import { localeAtom } from '@/jotai/atom';

import ar from '../locales/ar.json';
import en from '../locales/en.json';

const messages = { en, ar };

interface Props {
  children: ReactNode;
}

export default function IntlProviderWrapper({ children }: Props) {
  const storedLocale = useAtomValue(localeAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const locale = mounted ? storedLocale : 'ar';

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  );
}
