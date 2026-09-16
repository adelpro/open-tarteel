'use client';

import { useAtom } from 'jotai';
import { ReactNode, useEffect } from 'react';
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

const themeScript = `(function(){try{var k='theme-preference',s=localStorage.getItem(k),t=null;if(s){try{t=JSON.parse(s)}catch(e){t=s}}var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var cl=document.documentElement.classList;if(d){cl.add('dark');cl.remove('light');}else{cl.add('light');cl.remove('dark');}}catch(e){}})();`;

export default function HtmlWrapper({ children }: { children: ReactNode }) {
  const { locale } = useIntl();
  const { isRTL } = useDirection();
  const [theme] = useAtom(themeAtom);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const resolvedTheme = resolveTheme(theme);
      const cl = document.documentElement.classList;
      if (resolvedTheme === 'dark') {
        cl.add('dark');
        cl.remove('light');
      } else {
        cl.add('light');
        cl.remove('dark');
      }
    };

    updateTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      dir={isRTL ? 'rtl' : 'ltr'}
      className="h-[100vh]"
    >
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {children}
    </html>
  );
}
