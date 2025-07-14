import './globals.css';

import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';

import ActivityStatus from '@/components/activity-status';
import Footer from '@/components/footer';
import { clientConfig } from '@/utils';
const tajawal = Tajawal({
  weight: ['400', '700', '900'],
  subsets: ['arabic'],
  preload: true,
});
export const metadata: Metadata = {
  title: clientConfig.APP_NAME,
  description: 'استمع إلى تلاوات سيل القرآن',
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
          <ActivityStatus />
          <div className="w-full flex-grow">{children}</div>
          <Footer />
        </main>
      </body>
    </html>
  );
}
