import { expect, test } from '@playwright/test';

test('home has crawlable content and no client redirect', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText(/القرآن|Holy Quran|Koran/);
  await expect(page.locator('a[href^="/reciter/"]').first()).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');
});
