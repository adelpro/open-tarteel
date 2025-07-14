import React from 'react';

import { clientConfig } from '@/utils';

import PrivacyPageAr from './privacy-page-ar';

export async function generateMetadata() {
  const title = 'Privacy Policy - Arabic - ' + clientConfig.APP_NAME;
  const description = 'Arabic Privacy page for ' + clientConfig.APP_NAME;

  return {
    title,
    description,
  };
}
export default function Page() {
  return <PrivacyPageAr />;
}
