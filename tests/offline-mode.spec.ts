import { expect, test } from '@playwright/test';

test('manual offline mode gates network content', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('locale', JSON.stringify('en'));
  });

  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: 'Offline mode' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(
    page.getByText('Offline mode — downloaded content only')
  ).toBeVisible();

  // The reciter selector falls back to downloaded-only content.
  await page.goto('/');
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Open reciter selector' }).click();
  await expect(page.getByText('No downloaded reciters found')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).first().click();

  // The banner offers a quick way back online.
  await page.getByRole('button', { name: 'Go online' }).click();
  await expect(
    page.getByText('Offline mode — downloaded content only')
  ).toBeHidden();

  await page.goto('/settings');
  await expect(
    page.getByRole('switch', { name: 'Offline mode' })
  ).toHaveAttribute('aria-checked', 'false');
});
