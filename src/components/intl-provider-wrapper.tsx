'use client';

import { useAtomValue } from 'jotai';
import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

import { localeAtom } from '@/jotai/atom';

import ar from '../locales/ar.json';
import en from '../locales/en.json';

const messages = { en, ar };

interface Props {
  children: ReactNode;
}

export default function IntlProviderWrapper({ children }: Props) {
  const locale = useAtomValue(localeAtom);

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  );
}
