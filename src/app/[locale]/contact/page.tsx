import React from 'react';

import { clientConfig } from '@/utils';

import ContactPage from './contact-page';
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
      title: `Contact - English - ${appName}`,
      description: `Contact page in English for ${appName}`,
    };
  }

  // default Arabic
  return {
    title: `Contact - Arabic - ${appName}`,
    description: `Contact page in Arabic for ${appName}`,
  };
}

export default function page() {
  return <ContactPage />;
}
