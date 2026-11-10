import { breadcrumbTrail } from '@/lib/seo/json-ld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { withLocale } from '@/lib/seo/routes';
import { SITE } from '@/lib/seo/site';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';
import { getRequestLocale } from '@/utils/request-locale';

import PrivacyPageAr from './privacy-page';

const COPY = { ar, en, de } as const;

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return buildPageMetadata({
    locale,
    path: '/privacy',
    title: copy['privacy.title'],
    description: copy['privacy.section1.body'],
  });
}

export default async function Page() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];
  const breadcrumb = breadcrumbTrail([
    {
      name: locale === 'ar' ? 'الرئيسية' : 'Home',
      url: `${SITE.url}${withLocale(locale, '/')}`,
    },
    {
      name: copy['privacy.title'],
      url: `${SITE.url}${withLocale(locale, '/privacy')}`,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c'),
        }}
      />
      <PrivacyPageAr />
    </>
  );
}
