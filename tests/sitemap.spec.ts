import { expect, test } from '@playwright/test';

test('sitemap lists localized pages and no private routes', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);

  const xml = await response.text();
  expect(xml).toContain('<urlset');
  expect(xml).toContain('/en/about');
  expect(xml).toContain('/de/about');
  expect(xml).not.toContain('/settings');
  expect(xml).not.toContain('/offline');
  expect(xml).toContain('xmlns:xhtml=');
});

test('robots names the sitemap in production', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);

  const text = await response.text();
  expect(text).toContain('Sitemap:');
});
