import { describe, expect, it } from 'vitest';

import { breadcrumbTrail, faqPage, itemList, websiteGraph } from './json-ld';

describe('websiteGraph', () => {
  it('builds the site graph with stable @ids', () => {
    const graph = websiteGraph({
      origin: 'https://tarteel.example',
      locale: 'ar',
    }) as {
      '@graph': Array<Record<string, unknown>>;
    };

    expect(graph['@graph'].map((node) => node['@type'])).toEqual([
      'WebSite',
      'Organization',
      'WebApplication',
    ]);
    expect(graph['@graph'][0]?.['@id']).toContain('#website');
    expect(graph['@graph'][2]?.offers).toMatchObject({ price: '0' });
  });
});

describe('breadcrumbTrail', () => {
  it('numbers positions from 1', () => {
    const crumbs = breadcrumbTrail([
      { name: 'Home', url: 'https://tarteel.example/' },
      { name: 'About', url: 'https://tarteel.example/about' },
    ]) as { itemListElement: Array<{ position: number }> };

    expect(crumbs.itemListElement.map((item) => item.position)).toEqual([1, 2]);
  });
});

describe('itemList', () => {
  it('names each item and keeps its URL', () => {
    const list = itemList('Surahs', [
      { name: 'Al-Fatihah', url: 'https://tarteel.example/reciter/x?surah=1' },
    ]) as { itemListElement: Array<Record<string, unknown>> };

    expect(list.itemListElement[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: 'Al-Fatihah',
    });
  });
});

describe('faqPage', () => {
  it('uses the same answers the page shows', () => {
    const faq = faqPage([{ question: 'Is it free?', answer: 'Yes.' }]) as {
      mainEntity: Array<{ acceptedAnswer: { text: string } }>;
    };

    expect(faq.mainEntity[0]?.acceptedAnswer.text).toBe('Yes.');
  });
});
