import React from 'react';

import { clientConfig } from '@/utils';

import ContactPage from './contact-page';

export async function generateMetadata() {
  const title = 'Contact - ' + clientConfig.APP_NAME;
  const description = 'Contact page for ' + clientConfig.APP_NAME;

  return {
    title,
    description,
  };
}
export default function page() {
  return <ContactPage />;
}
