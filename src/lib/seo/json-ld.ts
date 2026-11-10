import type { SeoLocale } from './routes';
import { SITE } from './site';

type WebsiteGraphInput = {
  origin?: string;
  locale: SeoLocale;
};

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type ItemListEntry = {
  name: string;
  url: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

const cleanOrigin = (origin: string): string => origin.replace(/\/+$/, '');

/**
 * `WebSite` + `Organization` + `WebApplication`, one graph.
 *
 * The `@id` values are stable so a page can reference the publisher without
 * repeating the whole organisation node.
 */
export function websiteGraph({
  origin = SITE.url,
}: WebsiteGraphInput): Record<string, unknown> {
  const siteUrl = `${cleanOrigin(origin)}/`;
  const organization = {
    '@type': 'Organization',
    '@id': `${siteUrl}#organization`,
    name: SITE.name,
    url: siteUrl,
    logo: `${siteUrl.replace(/\/$/, '')}${SITE.logo}`,
    sameAs: [SITE.github],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: SITE.name,
        inLanguage: ['ar', 'en', 'de'],
        publisher: { '@id': `${siteUrl}#organization` },
      },
      organization,
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}#app`,
        name: SITE.name,
        url: siteUrl,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        inLanguage: ['ar', 'en', 'de'],
        publisher: { '@id': `${siteUrl}#organization` },
      },
    ],
  };
}

/** A trail from the root down, with contiguous 1-based positions. */
export function breadcrumbTrail(
  items: BreadcrumbItem[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** A list of the links a page actually shows. */
export function itemList(
  name: string,
  items: ItemListEntry[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

/** FAQ markup built from the same questions the page renders. */
export function faqPage(items: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
