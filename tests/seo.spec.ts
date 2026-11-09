import { expect, test } from '@playwright/test';

test('home has a canonical and JSON-LD', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /^https?:\/\/[^/]+\/?$/
  );
  await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0);
});

test('the English about page keeps its language and twins', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/en\/about$/
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
});

test('a reciter page has a name and 114 surah links', async ({ page }) => {
  await page.goto('/reciter/itqan.dev-2');
  await expect(page.locator('h1')).toContainText(/بدر|Badr/);
  await expect(page.locator('a[href*="surah="]')).toHaveCount(114);
});

test('an unknown reciter is a 404', async ({ page }) => {
  const response = await page.goto('/reciter/does-not-exist');
  expect(response?.status()).toBe(404);
});

test('a localized reciter twin canonicalises to the Arabic page', async ({
  page,
}) => {
  await page.goto('/en/reciter/itqan.dev-2');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/reciter\/itqan\.dev-2$/
  );
});

test('settings is noindex', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/
  );
});

test('the sitemap omits private routes', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  const xml = await response.text();
  expect(xml).not.toContain('/settings');
  expect(xml).not.toContain('/offline');
});
