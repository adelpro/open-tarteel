import ContactPage from '@/components/pages/contact-page';
import { breadcrumbTrail } from '@/lib/seo/json-ld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { type SeoLocale, withLocale } from '@/lib/seo/routes';
import { SITE } from '@/lib/seo/site';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';

const COPY = { ar, en, de } as const;

export const contactMetadata = (locale: SeoLocale) => {
  const copy = COPY[locale];

  return buildPageMetadata({
    locale,
    path: '/contact',
    title: `${copy['contact.contact_us']} — Open Tarteel`,
    description: copy['contact.contact_us'],
  });
};

export function ContactRoute({ locale }: { locale: SeoLocale }) {
  const copy = COPY[locale];
  const breadcrumb = breadcrumbTrail([
    {
      name: locale === 'ar' ? 'الرئيسية' : 'Home',
      url: `${SITE.url}${withLocale(locale, '/')}`,
    },
    {
      name: copy['contact.contact_us'],
      url: `${SITE.url}${withLocale(locale, '/contact')}`,
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
      <ContactPage />
    </>
  );
}
