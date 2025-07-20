'use client';

import { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import useDirection from '@/hooks/use-direction';

export default function HtmlWrapper({ children }: { children: ReactNode }) {
  const { locale } = useIntl();
  const { isRTL } = useDirection();
  return (
    <html lang={locale} suppressHydrationWarning dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </html>
  );
}
