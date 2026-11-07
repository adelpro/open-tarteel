import React from 'react';

import { clientConfig, normalizeAppUrl } from '@/utils';

import ContactPage from './contact-page';

export async function generateMetadata() {
  const title = 'Contact - ' + clientConfig.APP_NAME;
  const description = 'Contact page for ' + clientConfig.APP_NAME;
  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/contact` },
  };
}
export default function page() {
  return <ContactPage />;
}
