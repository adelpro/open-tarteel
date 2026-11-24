import OfflinePage from '@/app/(ar)/offline/page';

/**
 * The service worker's fallback page. Same reason as settings: its own route so
 * the document and its copy are the right language before hydration.
 */
export const metadata = {
  title: 'Offline | Open Tarteel',
  alternates: { canonical: '/de/offline' },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OfflinePage />;
}
