import { expect, test } from '@playwright/test';

test('desktop pinned reciter list stays open after choosing a reciter', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const openButton = page
    .getByRole('button', {
      name: /Open reciter selector|فتح قائمة القراء|اختر القارئ/i,
    })
    .first();
  await expect(openButton).toBeVisible();
  await page.waitForTimeout(500);
  await openButton.click();

  const aside = page.locator('aside[aria-label]').first();
  await expect(aside).toBeVisible();

  await aside
    .locator('button[title="Pin panel"], button[title="تثبيت اللوحة"]')
    .first()
    .click();
  await page.waitForTimeout(600);

  const firstReciter = aside.locator('li button').first();
  await expect(firstReciter).toBeVisible();
  await firstReciter.click({ force: true });

  await expect(page).toHaveURL(/\/reciter\//);
  await expect(page.locator('aside[aria-label]').first()).toBeVisible();
  await expect(
    page
      .getByRole('button', {
        name: /Unpin panel|إلغاء تثبيت اللوحة/i,
      })
      .first()
  ).toBeVisible();
});
