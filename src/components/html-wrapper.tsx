'use client';

import { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import useDirection from '@/hooks/use-direction';
import { useTheme } from '@/hooks/use-theme';

/**
 * Runs before first paint: restores the palette and the light/dark mode so the
 * app never flashes the default theme on reload.
 */
const themeScript = `(function(){try{
var p=localStorage.getItem('theme-palette');
if(p){try{p=JSON.parse(p)}catch(e){}}
if(p!=='classic'&&p!=='night'&&p!=='warm'){p='warm';}
var s=localStorage.getItem('theme-preference'),t=null;
if(s){try{t=JSON.parse(s)}catch(e){t=s;}}
var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var el=document.documentElement;el.setAttribute('data-theme',p);
var cl=el.classList;
if(d){cl.add('dark');cl.remove('light');}else{cl.add('light');cl.remove('dark');}
}catch(e){}})();`;

export default function HtmlWrapper({ children }: { children: ReactNode }) {
  const { locale } = useIntl();
  const { isRTL } = useDirection();
  // Keeps <html> in sync when the user changes palette or mode.
  useTheme();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      dir={isRTL ? 'rtl' : 'ltr'}
      data-theme="warm"
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
