import { expect, test } from '@playwright/test';

test('auto mode detects a network loss that fires no offline event', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('offline-mode', '"auto"');
    // Some mobile networks die without changing navigator.onLine. The app must
    // still discover this through its periodic /offline-check probe.
    Object.defineProperty(navigator, 'onLine', {
      get: () => true,
      configurable: true,
    });
  });

  await page.goto('/en');
  for (let attempt = 0; attempt < 18; attempt += 1) {
    await page.waitForTimeout(5_000);
    try {
      if (
        await page.evaluate(() => Boolean(navigator.serviceWorker.controller))
      ) {
        break;
      }
    } catch {
      // The preview build may reload once when the worker takes control.
    }
  }
  expect(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller))
  ).toBe(true);

  await context.setOffline(true);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          document.body.innerText.includes('Offline: showing downloads')
        ),
      { timeout: 45_000 }
    )
    .toBe(true);
});
