import { type Browser, expect, type Page, test } from '@playwright/test';

/**
 * Two devices, one ring, linked by pasting the code; a third tries the same
 * code and must be refused.
 *
 * Runs against the relay in `GUN_PEERS`. The relay is the part under test —
 * the envelope is published by one browser and read by another — so it is not
 * mocked. The ring it creates is a throwaway keypair; the envelope is burned
 * by the test itself.
 */

const RELAY_TIMEOUT = 30_000;

async function openSettings(browser: Browser, clipboard = false) {
  const context = await browser.newContext(
    clipboard ? { permissions: ['clipboard-read', 'clipboard-write'] } : {}
  );
  const page = await context.newPage();
  await page.goto('/en/settings');
  // `/en/settings` is the Arabic `/settings` page rewritten; the locale switches
  // on the client after hydration. Wait for the English page to settle, so the
  // panel is the one copy that stays.
  await expect(
    page.getByRole('heading', { level: 1, name: 'Settings' })
  ).toBeVisible();
  const panel = page.getByTestId('account-panel');
  await expect(panel).toHaveCount(1);
  await expect(panel).toBeVisible();
  return { context, page, panel };
}

async function pasteCode(page: Page, ticket: string) {
  const panel = page.getByTestId('account-panel');
  await panel
    .getByRole('button', { name: 'Enter the code by hand', exact: true })
    .click();
  await panel.getByLabel('Enter the code by hand').fill(ticket);
  await panel.getByRole('button', { name: 'Link', exact: true }).click();
}

test('a second device joins by paste, and the code works only once', async ({
  browser,
}) => {
  test.setTimeout(150_000);

  // A: create a ring with only a name.
  const a = await openSettings(browser, true);
  await a.panel.getByLabel('Ring name').fill('Playwright ring');
  await a.panel.getByRole('button', { name: 'Create ring' }).click();
  await expect(a.panel.getByText('1 device', { exact: true })).toBeVisible({
    timeout: RELAY_TIMEOUT,
  });

  // A: draw a code and copy it as text.
  await a.panel.getByRole('button', { name: 'Add device' }).click();
  await a.panel.getByRole('button', { name: 'Show pairing code' }).click();
  const popup = a.page.getByRole('dialog', {
    name: 'Add a device to the ring',
  });
  await expect(popup).toBeVisible();
  await popup.getByRole('button', { name: 'Copy the code' }).click();
  const ticket = await a.page.evaluate(() => navigator.clipboard.readText());
  expect(JSON.parse(ticket)).toMatchObject({ v: 2 });

  // B: join by paste.
  const b = await openSettings(browser);
  await pasteCode(b.page, ticket);
  await expect(b.panel.getByText('This device is now in the ring')).toBeVisible(
    { timeout: RELAY_TIMEOUT }
  );
  await expect(b.panel.getByText('Playwright ring')).toBeVisible({
    timeout: RELAY_TIMEOUT,
  });

  // A: the popup closes on its own once B's device row appears.
  await expect(popup).toBeHidden({ timeout: RELAY_TIMEOUT });
  await expect(a.panel.getByText('2 devices', { exact: true })).toBeVisible();

  // Two devices: sign-out needs no confirmation word.
  await a.panel.getByRole('button', { name: 'Devices', exact: true }).click();
  await expect(
    a.panel.getByRole('button', { name: 'Sign out on this device' })
  ).toBeEnabled();

  // C: the same code again. Burned on read, so it fails with a reason.
  const c = await openSettings(browser);
  await pasteCode(c.page, ticket);
  await expect(c.panel.getByRole('alert')).toHaveText(
    'That code is not valid, or it has expired',
    { timeout: RELAY_TIMEOUT }
  );
  await expect(
    c.panel.getByRole('button', { name: 'Create ring' })
  ).toBeVisible();

  await Promise.all([a.context.close(), b.context.close(), c.context.close()]);
});

test('the last device needs the confirmation word to sign out', async ({
  browser,
}) => {
  const a = await openSettings(browser);
  await a.panel.getByLabel('Ring name').fill('Lone ring');
  await a.panel.getByRole('button', { name: 'Create ring' }).click();
  await expect(a.panel.getByText('1 device', { exact: true })).toBeVisible({
    timeout: RELAY_TIMEOUT,
  });

  const signOut = a.panel.getByRole('button', {
    name: 'Sign out on this device',
  });
  await expect(signOut).toBeDisabled();
  await a.panel.getByLabel('Type “sign out” to confirm').fill('sign out');
  await expect(signOut).toBeEnabled();
  await signOut.click();

  await expect(
    a.panel.getByRole('button', { name: 'Create ring' })
  ).toBeVisible();
  expect(
    await a.page.evaluate(() => localStorage.getItem('tarteel:account'))
  ).toBeNull();

  await a.context.close();
});
