import './globals.css';

import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

import HtmlWrapper from '@/components/html-wrapper';
import IntlProviderWrapper from '@/components/intl-provider-wrapper';
import { getMessages } from '@/utils/get-messages';
type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  const defaultLocale = locale === 'en' ? 'en' : 'ar';

  const messages = await getMessages(defaultLocale);

  if (!messages) notFound();

  return (
    <HtmlWrapper lang={defaultLocale}>
      <IntlProviderWrapper locale={defaultLocale} messages={messages}>
        <main className="relative flex min-h-dvh w-full flex-col items-center justify-center text-foreground">
          <div className="flex w-full flex-grow items-center justify-center">
            {children}
          </div>
        </main>
      </IntlProviderWrapper>
    </HtmlWrapper>
  );
}
