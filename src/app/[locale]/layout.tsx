import '../globals.css';

import { Tajawal } from 'next/font/google';

import ExitFullscreen from '@/components/exit-fullscreen';
import Footer from '@/components/footer';
import Header from '@/components/header';
import MainLayout from '@/components/main-layout';
import Player from '@/components/player';
import ProvidersWrapper from '@/components/providers';
import PwaUpdater from '@/components/pwa-updater';
import SyncFullscreen from '@/components/sync-fullscreen';
import LibraryTracksSyncs from '@/components/sync-library-tracks';
import UnderConstruction from '@/components/under-construction';

const tajawal = Tajawal({
  weight: ['400', '700', '900'],
  subsets: ['arabic'],
  preload: true,
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  const direction = locale === 'en' ? 'ltr' : 'rtl';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${tajawal.className} bg-background antialiased`}>
        <ProvidersWrapper>
          <main className="flex h-dvh flex-col overflow-hidden">
            <Header />
            <MainLayout>{children}</MainLayout>
            <Player />
            <Footer />
            <PwaUpdater />
            <UnderConstruction />
            <ExitFullscreen />
            <SyncFullscreen />
            <LibraryTracksSyncs />{' '}
          </main>
        </ProvidersWrapper>
      </body>
    </html>
  );
}
