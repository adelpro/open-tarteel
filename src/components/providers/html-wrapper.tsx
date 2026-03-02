'use client';

import { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import useDirection from '@/hooks/use-direction';

export default function HtmlWrapper({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { locale } = useIntl();
  const { dir } = useDirection();
  return (
    <html lang={locale} suppressHydrationWarning dir={dir}>
      {children}
    </html>
  );
}
