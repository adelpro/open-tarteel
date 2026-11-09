import { expect, test } from '@playwright/test';

test('classic palette has no blue background wash', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme-palette', JSON.stringify('classic'));
    localStorage.setItem('theme-preference', JSON.stringify('light'));
  });

  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic');
  const backgroundImage = await page.evaluate(
    () => getComputedStyle(document.body).backgroundImage
  );
  expect(backgroundImage).toBe('none');
});
