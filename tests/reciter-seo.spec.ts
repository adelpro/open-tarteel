import { expect, test } from '@playwright/test';

test('reciter page keeps the logo and has no surah list above the player', async ({
  page,
}) => {
  await page.goto('/reciter/itqan.dev-2');

  await expect(page.locator('h1')).toContainText(/القرآن|Holy Quran|Koran/);
  await expect(page.locator('img[alt*="Logo"]').first()).toBeVisible();
  await expect(page.locator('a[href*="surah="]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/reciter\/itqan\.dev-2$/
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
});

test('a direct surah link still starts that surah', async ({ page }) => {
  await page.goto('/reciter/itqan.dev-2?moshafId=11&surah=18');

  await expect(page.locator('audio')).toHaveAttribute('src', /018\.mp3/);
});

test('unknown reciter is a 404', async ({ page }) => {
  const response = await page.goto('/reciter/does-not-exist');
  expect(response?.status()).toBe(404);
});
