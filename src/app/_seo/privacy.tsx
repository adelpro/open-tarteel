import PrivacyPage from '@/components/pages/privacy-page';
import { breadcrumbTrail } from '@/lib/seo/json-ld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { type SeoLocale, withLocale } from '@/lib/seo/routes';
import { SITE } from '@/lib/seo/site';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';

const COPY = { ar, en, de } as const;

export const privacyMetadata = (locale: SeoLocale) => {
  const copy = COPY[locale];

  return buildPageMetadata({
    locale,
    path: '/privacy',
    title: copy['privacy.title'],
    description: copy['privacy.section1.body'],
  });
};

export function PrivacyRoute({ locale }: { locale: SeoLocale }) {
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
      <PrivacyPage />
    </>
  );
}
