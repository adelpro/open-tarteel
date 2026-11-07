import { expect, test } from '@playwright/test';

const RECITER_PATH = '/reciter/mp3quran.net-1?moshafId=1';
const FIRST_TRACK_URL =
  'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/001.mp3';

test('downloaded audio survives a cold offline start', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('locale', JSON.stringify('en'));
  });

  await page.goto(RECITER_PATH);
  await page.getByRole('button', { name: 'Playlist' }).click();
  await expect(
    page.getByRole('button', { name: 'Download surah' }).first()
  ).toBeVisible();

  // Download three short surahs. Al-Faatiha is first so the default track
  // can play straight from the offline cache.
  const downloadedSurahs = ['Al-Faatiha', 'Al-Ikhlaas', 'Al-Falaq'];
  for (const [index, surah] of downloadedSurahs.entries()) {
    const row = page.getByRole('listitem').filter({ hasText: surah });
    await row.getByRole('button', { name: 'Download surah' }).click();
    await expect(
      row.getByRole('button', { name: 'Remove download' })
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByRole('button', { name: 'Remove download' })
    ).toHaveCount(index + 1);
  }

  // Ensure the service worker is active and controlling the page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () =>
          resolve()
        );
      });
    }
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Playlist' })).toBeVisible();

  // Go offline and reload the app shell from the service worker.
  await context.setOffline(true);
  await page.reload();

  await page.getByRole('button', { name: 'Playlist' }).click();
  await expect(
    page.getByRole('button', { name: 'Remove download' })
  ).toHaveCount(3);
  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.getByRole('dialog')).toBeHidden();

  // Range requests must be served from the downloaded cache with 206.
  const range = await page.evaluate(async (url) => {
    const response = await fetch(url, {
      headers: { Range: 'bytes=0-99' },
    });
    return {
      status: response.status,
      length: (await response.arrayBuffer()).byteLength,
    };
  }, FIRST_TRACK_URL);
  expect(range.status).toBe(206);
  expect(range.length).toBe(100);

  // Play and verify audio + visualizer both start on the first click.
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (document.getElementById('audio') as HTMLAudioElement | null)
              ?.currentTime ?? 0
        ),
      { timeout: 15_000 }
    )
    .toBeGreaterThan(0.5);

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return 0;
          const context = canvas.getContext('2d');
          if (!context) return 0;
          const data = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          ).data;
          let painted = 0;
          for (let index = 3; index < data.length; index += 4) {
            if (data[index] > 0) painted += 1;
          }
          return painted;
        }),
      { timeout: 15_000 }
    )
    .toBeGreaterThan(0);

  // Cache management must work offline from IndexedDB metadata.
  await page.goto('/settings');
  await expect(page.getByText('Ibrahim Al-Akdar')).toBeVisible();
});
