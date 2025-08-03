'use client';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

type Props = {
  locale: string;
  messages: Record<string, string>;
  children: ReactNode;
};

export default function IntlProviderWrapper({
  locale,
  messages,
  children,
}: Props) {
  return (
    <IntlProvider
      locale={locale === 'en' ? 'en' : 'ar'}
      defaultLocale="ar"
      messages={messages}
    >
      {children}
    </IntlProvider>
  );
}
