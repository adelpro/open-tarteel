import { expect, test } from '@playwright/test';

for (const path of ['/about', '/contact', '/privacy']) {
  test(`${path} has a localized canonical and an H1`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`${path}$`)
    );
  });
}

test('settings is noindex', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/
  );
});
