import React from 'react';

import { clientConfig, normalizeAppUrl } from '@/utils';

import PrivacyPageAr from './privacy-page';

export async function generateMetadata() {
  const title = 'Privacy Policy - Arabic - ' + clientConfig.APP_NAME;
  const description = 'Arabic Privacy page for ' + clientConfig.APP_NAME;
  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/privacy` },
  };
}
export default function Page() {
  return <PrivacyPageAr />;
}
