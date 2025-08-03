'use client';

import { Tajawal } from 'next/font/google';

const tajawal = Tajawal({
  weight: ['400', '700', '900'],
  subsets: ['arabic'],
  preload: true,
});

type Props = {
  lang: string;
  children: React.ReactNode;
};

export default function HtmlWrapper({ lang, children }: Props) {
  const isRTL = lang === 'ar';
  return (
    <html lang={lang} suppressHydrationWarning dir={isRTL ? 'rtl' : 'ltr'}>
      <body className={`${tajawal.className} antialiased`}>{children}</body>
    </html>
  );
}
