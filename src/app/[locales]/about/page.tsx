import { clientConfig } from '@/utils';

import AboutPage from './about-page';

export async function generateMetadata() {
  const title = 'About - ' + clientConfig.APP_NAME;
  const description = 'About page for ' + clientConfig.APP_NAME;

  return {
    title,
    description,
  };
}
export default function page() {
  return <AboutPage />;
}
