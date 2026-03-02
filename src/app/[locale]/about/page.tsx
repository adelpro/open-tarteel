import { clientConfig } from '@/utils';

import AboutPage from './about-page';

export async function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appName = clientConfig.APP_NAME;

  if (locale === 'en') {
    return {
      title: `About - English - ${appName}`,
      description: `About page in English for ${appName}`,
    };
  }

  // default Arabic
  return {
    title: `About - Arabic - ${appName}`,
    description: `About page in Arabic for ${appName}`,
  };
}

export default function page() {
  return <AboutPage />;
}
