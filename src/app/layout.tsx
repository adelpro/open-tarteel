import './globals.css';

import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';

import Footer from '@/components/footer';
import { clientConfig } from '@/utils';
const tajawal = Tajawal({
  weight: ['400', '700', '900'],
  subsets: ['arabic'],
  preload: true,
});
export const metadata: Metadata = {
  title: clientConfig.APP_NAME,
  description:
    'القرآن كما يجب أن يكون، تلاوات تلامس القلب دون إعلانات، تتبع و لا إلهاء.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body className={`${tajawal.className} antialiased`}>
        <main className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-background text-foreground">
          <div className="w-full flex-grow">{children}</div>
          <Footer />
        </main>
      </body>
    </html>
  );
}
