import { expect, test } from '@playwright/test';

const storedReciter = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1',
    name: "Rewayat Hafs A'n Assem - Murattal",
    riwaya: 'حفص',
    server: 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/',
    surah_total: '3',
    surahIds: '1,2,3',
    playlist: [1, 2, 3].map((surah) => ({
      surahId: String(surah),
      link: `https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/${String(surah).padStart(3, '0')}.mp3`,
    })),
  },
};

const RECITER_PATH = '/reciter/mp3quran.net-1?moshafId=1';

test('a stored reciter opens the player from the home', async ({ page }) => {
  await page.addInitScript((reciter) => {
    localStorage.setItem('selected-reciter', JSON.stringify(reciter));
  }, storedReciter);

  await page.goto('/');

  await expect(page).toHaveURL(/\/reciter\/mp3quran\.net-1\?moshafId=1$/);
  await expect(page.locator('#audio')).toHaveCount(1);
});

test('a stored reciter without a cached playlist still opens the player', async ({
  page,
}) => {
  await page.addInitScript((reciter) => {
    localStorage.setItem(
      'selected-reciter',
      JSON.stringify({
        ...reciter,
        moshaf: { ...reciter.moshaf, playlist: [] },
      })
    );
  }, storedReciter);

  await page.goto('/');

  await expect(page).toHaveURL(/\/reciter\/mp3quran\.net-1\?moshafId=1$/);
  await expect(page.locator('#audio')).toHaveCount(1);
});

test('the route cookie redirects on the server', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    {
      name: 'reciter-route',
      value: encodeURIComponent(RECITER_PATH),
      url: baseURL as string,
    },
  ]);

  await page.goto('/');

  await expect(page).toHaveURL(/\/reciter\/mp3quran\.net-1\?moshafId=1$/);
  await expect(page.locator('#audio')).toHaveCount(1);
});

test('a stored reciter renders its player on a cold load', async ({ page }) => {
  await page.addInitScript((reciter) => {
    localStorage.setItem('selected-reciter', JSON.stringify(reciter));
  }, storedReciter);

  await page.goto(RECITER_PATH);

  await expect(page.locator('#audio')).toHaveCount(1);
  await expect(page.getByRole('slider')).toBeVisible();
});

test('a corrupt stored reciter does not break the home page', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'selected-reciter',
      JSON.stringify({ id: 'mp3quran.net-1', name: 'Broken' })
    );
  });

  await page.goto('/');

  await expect(
    page.getByRole('button', { name: 'Open reciter selector' })
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Application error');
});

test('the first visit does not reload after the service worker claims', async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'loads',
      String(Number(sessionStorage.getItem('loads') ?? 0) + 1)
    );
  });

  await page.goto(RECITER_PATH);
  await expect(page.locator('#audio')).toHaveCount(1);
  await page.waitForTimeout(3000);

  expect(await page.evaluate(() => sessionStorage.getItem('loads'))).toBe('1');
});

test('the player mount does not shift the layout', async ({ page }) => {
  await page.addInitScript((reciter) => {
    localStorage.setItem('selected-reciter', JSON.stringify(reciter));
    localStorage.setItem('show-visualizer', JSON.stringify(true));
  }, storedReciter);
  await page.addInitScript(() => {
    const win = window as unknown as { __cls: number };
    win.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{
        value: number;
        hadRecentInput: boolean;
      }>) {
        if (!entry.hadRecentInput) win.__cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto(RECITER_PATH);
  await expect(page.locator('#audio')).toHaveCount(1);
  await page.waitForTimeout(1000);

  const cls = await page.evaluate(
    () => (window as unknown as { __cls: number }).__cls
  );
  expect(cls).toBeLessThan(0.05);
});
