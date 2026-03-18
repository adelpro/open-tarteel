'use client';

import { useAtom } from 'jotai';
import Head from 'next/head';
import { ReactNode } from 'react';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import useDirection from '@/hooks/use-direction';
import { type Theme, themeAtom } from '@/jotai/atom';

function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

export default function HtmlWrapper({ children }: { children: ReactNode }) {
  const { locale } = useIntl();
  const { isRTL } = useDirection();
  const [theme] = useAtom(themeAtom);

  useEffect(() => {
    const resolvedTheme = resolveTheme(theme);

    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      dir={isRTL ? 'rtl' : 'ltr'}
      className="h-[100vh]"
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      {children}
    </html>
  );
}
