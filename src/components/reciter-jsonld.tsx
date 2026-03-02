'use client';

import Script from 'next/script';
import React from 'react';
import { useIntl } from 'react-intl';

import { Reciter } from '@/types';
import { clientConfig, makeRecentReciterKey, normalizeAppUrl } from '@/utils';

interface JsonLdPersonProps {
  readonly reciter: Reciter | undefined | null;
}

export function ReciterJsonld({ reciter }: JsonLdPersonProps) {
  const { locale } = useIntl();
  if (!reciter) return;

  return (
    <Script
      id={makeRecentReciterKey(reciter.id, reciter.moshaf.id, locale)}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: reciter?.name,
          url: `${normalizeAppUrl(clientConfig.APP_URL)}/reciter/${reciter.id}`,
        }),
      }}
    />
  );
}
