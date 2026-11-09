import type { Metadata } from 'next';

import { alternatesFor, type SeoLocale, withLocale } from './routes';
import { OG_LOCALES, SITE } from './site';

type BuildMetadataInput = {
  locale: SeoLocale;
  path: string;
  title: string;
  description: string;
  /** Defaults to the configured site origin; tests pin it. */
  origin?: string;
  image?: string;
  type?: 'website' | 'article';
  robots?: Metadata['robots'];
};

const absolute = (origin: string, value: string): string =>
  /^https?:\/\//i.test(value) ? value : `${origin}${value}`;

const otherLocales = (locale: SeoLocale): string[] =>
  (Object.keys(OG_LOCALES) as SeoLocale[])
    .filter((candidate) => candidate !== locale)
    .map((candidate) => OG_LOCALES[candidate]);

/**
 * The canonical, language twins, Open Graph and Twitter card for one page.
 *
 * Every public page goes through this helper so a page cannot accidentally
 * point its canonical at the home page or omit the `x-default` twin.
 */
export const buildPageMetadata = ({
  locale,
  path,
  title,
  description,
  origin = SITE.url,
  image = SITE.ogImage,
  type = 'website',
  robots,
}: BuildMetadataInput): Metadata => {
  const base = origin.replace(/\/+$/, '');
  const canonical = `${base}${withLocale(locale, path)}`;
  const alternates = alternatesFor(path);
  const imageUrl = absolute(base, image);

  return {
    metadataBase: new URL(base),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: absolute(base, alternates.ar),
        en: absolute(base, alternates.en),
        de: absolute(base, alternates.de),
        'x-default': absolute(base, alternates['x-default']),
      },
    },
    openGraph: {
      type,
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: OG_LOCALES[locale],
      alternateLocale: otherLocales(locale),
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    ...(robots ? { robots } : {}),
  };
};
