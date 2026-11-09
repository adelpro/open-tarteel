import { expect, test } from '@playwright/test';

test('reciter page names the reciter and lists surahs', async ({ page }) => {
  await page.goto('/reciter/itqan.dev-2');

  await expect(page.locator('h1')).toContainText(/بدر|Badr/);
  await expect(page.locator('a[href*="surah="]')).toHaveCount(114);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/reciter\/itqan\.dev-2$/
  );
});

test('a surah link starts that surah', async ({ page }) => {
  await page.goto('/reciter/itqan.dev-2?moshafId=11&surah=18');

  await expect(page.locator('audio')).toHaveAttribute('src', /018\.mp3/);
});

test('unknown reciter is a 404', async ({ page }) => {
  const response = await page.goto('/reciter/does-not-exist');
  expect(response?.status()).toBe(404);
});
