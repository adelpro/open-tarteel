import { expect, test } from '@playwright/test';

test('home keeps the logo and has no reciter suggestions above the player', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText(/القرآن|Holy Quran|Koran/);
  await expect(page.locator('img[alt*="Logo"]').first()).toBeVisible();
  await expect(page.locator('a[href^="/reciter/"]')).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe('/');
});
