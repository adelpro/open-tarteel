import { clientConfig, normalizeAppUrl } from '@/utils';

import AboutPage from './about-page';

export async function generateMetadata() {
  const title = 'About - ' + clientConfig.APP_NAME;
  const description = 'About page for ' + clientConfig.APP_NAME;
  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/about` },
  };
}
export default function page() {
  return <AboutPage />;
}
