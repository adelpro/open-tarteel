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

test('a stored reciter opens its player without the catalog', async ({
  page,
}) => {
  await page.addInitScript((reciter) => {
    localStorage.setItem('locale', JSON.stringify('en'));
    localStorage.setItem('selected-reciter', JSON.stringify(reciter));
  }, storedReciter);
  await page.route(/\/api\/reciters\?/, (route) => route.abort());

  await page.goto('/');

  await expect(page).toHaveURL(/\/reciter\/mp3quran\.net-1\?moshafId=1$/);
  await expect(page.locator('#audio')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Play', exact: true })
  ).toBeVisible();
});

test('the player mount does not shift the layout', async ({ page }) => {
  await page.addInitScript((reciter) => {
    localStorage.setItem('locale', JSON.stringify('en'));
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

  await page.goto('/');
  await expect(page.locator('#audio')).toHaveCount(1);
  await page.waitForTimeout(1000);

  const cls = await page.evaluate(
    () => (window as unknown as { __cls: number }).__cls
  );
  expect(cls).toBeLessThan(0.05);
});
