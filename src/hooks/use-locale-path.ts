'use client';

import { useIntl } from 'react-intl';

import { type SeoLocale, withLocale } from '@/lib/seo/routes';

/** Prefix an internal path with the locale the interface is currently using. */
export function useLocalePath() {
  const { locale } = useIntl();
  return (path: string) => withLocale(locale as SeoLocale, path);
}
