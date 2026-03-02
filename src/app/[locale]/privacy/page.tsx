import React from 'react';

import { clientConfig } from '@/utils';

import PrivacyPage from './privacy-page';

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
      title: `Privacy Policy - English - ${appName}`,
      description: `English Privacy page for ${appName}`,
    };
  }

  // default Arabic
  return {
    title: `Privacy Policy - Arabic - ${appName}`,
    description: `Arabic Privacy page for ${appName}`,
  };
}
export default function Page() {
  return <PrivacyPage />;
}
