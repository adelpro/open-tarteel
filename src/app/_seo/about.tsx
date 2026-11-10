import AboutPage from '@/components/pages/about-page';
import { breadcrumbTrail, faqPage } from '@/lib/seo/json-ld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { type SeoLocale, withLocale } from '@/lib/seo/routes';
import { SITE } from '@/lib/seo/site';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';

const COPY = { ar, en, de } as const;

const faqFor = (locale: SeoLocale) => {
  const copy = COPY[locale];
  return [1, 2, 3, 4].map((number) => ({
    question: copy[`about.faq.q${number}` as keyof typeof copy],
    answer: copy[`about.faq.a${number}` as keyof typeof copy],
  }));
};

export const aboutMetadata = (locale: SeoLocale) => {
  const copy = COPY[locale];

  return buildPageMetadata({
    locale,
    path: '/about',
    title: copy['about.title'],
    description: copy['about.description'],
  });
};

export function AboutRoute({ locale }: { locale: SeoLocale }) {
  const copy = COPY[locale];
  const breadcrumb = breadcrumbTrail([
    {
      name: locale === 'ar' ? 'الرئيسية' : 'Home',
      url: `${SITE.url}${withLocale(locale, '/')}`,
    },
    {
      name: copy['about.title'],
      url: `${SITE.url}${withLocale(locale, '/about')}`,
    },
  ]);
  const faq = faqPage(faqFor(locale));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumb, faq]).replace(/</g, '\\u003c'),
        }}
      />
      <AboutPage />
    </>
  );
}
