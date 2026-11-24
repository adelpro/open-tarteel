import { expect, test } from '@playwright/test';

test('three-level offline mode gates network content', async ({ page }) => {
  await page.goto('/en/settings');

  const mode = page.getByRole('group', { name: 'Offline mode' });
  await expect(mode.getByRole('button', { name: 'Auto' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  await mode.getByRole('button', { name: 'On' }).click();
  await expect(mode.getByRole('button', { name: 'On' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(
    page.getByText(
      'Offline mode is on. Only downloaded reciters and surahs are available.'
    )
  ).toBeVisible();

  // Downloads-only filtering and the banner appear on the home screen.
  await page.goto('/en/');
  await expect(page.getByText('Offline: downloads only')).toBeVisible();
  await page.getByRole('button', { name: 'Open reciter selector' }).click();
  const scope = page.getByRole('group', { name: 'Reciter scope' });
  await expect(
    scope.getByRole('button', { name: 'Downloaded' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(scope.getByRole('button', { name: 'All' })).toBeDisabled();
  await expect(page.getByText('0 reciters', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).first().click();

  // The banner returns to automatic mode.
  await page.getByRole('button', { name: 'Go online' }).click();
  await expect(page.getByText('Offline: downloads only')).toBeHidden();

  await page.goto('/en/settings');
  await expect(
    page.getByRole('group', { name: 'Offline mode' }).getByRole('button', {
      name: 'Auto',
    })
  ).toHaveAttribute('aria-pressed', 'true');

  // Off removes downloads-only filtering even with the network genuinely up.
  await page
    .getByRole('group', { name: 'Offline mode' })
    .getByRole('button', {
      name: 'Off',
    })
    .click();
  await expect(page.getByText('Offline: downloads only')).toBeHidden();
  await expect(
    page.getByText(
      'Offline mode is off. Always use the network when it is available.'
    )
  ).toBeVisible();
});
