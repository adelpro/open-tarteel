'use client';

import Head from 'next/head';
import { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import useDirection from '@/hooks/use-direction';

export default function HtmlWrapper({ children }: { children: ReactNode }) {
  const { locale } = useIntl();
  const { isRTL } = useDirection();
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
      <script
        defer
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `try{let t=localStorage.getItem("theme-preference");if(!t||t==='"system"'){let e=window.matchMedia("(prefers-color-scheme: dark)").matches;if(!t)localStorage.setItem("theme-preference",'"system"');t=e?'"dark"':'"light"'}if(t==='"dark"'){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}`,
        }}
      />
      {children}
    </html>
  );
}
