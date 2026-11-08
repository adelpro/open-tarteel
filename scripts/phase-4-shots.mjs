import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';
const OUT_DIR = path.join(process.cwd(), 'docs', 'previews', 'phase-4');
const PLAYER_URL = `${BASE_URL}/reciter/mp3quran.net-1?moshafId=1`;

const cases = [
  {
    name: 'warm-light',
    palette: 'warm',
    mode: 'light',
    viewport: { width: 390, height: 844 },
    scale: 2,
  },
  {
    name: 'night-dark',
    palette: 'night',
    mode: 'dark',
    viewport: { width: 390, height: 844 },
    scale: 2,
  },
  {
    name: 'warm-light-desktop',
    palette: 'warm',
    mode: 'light',
    viewport: { width: 1280, height: 800 },
    scale: 1,
  },
];

async function settle(page, palette, mode) {
  await page.waitForFunction(
    ([p, m]) => {
      const root = document.documentElement;
      return (
        root.dataset.theme === p &&
        root.classList.contains('dark') === (m === 'dark')
      );
    },
    [palette, mode],
    { timeout: 15000 }
  );
  await page.evaluate(() => document.fonts.ready);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    for (const item of cases) {
      const context = await browser.newContext({
        viewport: item.viewport,
        deviceScaleFactor: item.scale,
        colorScheme: item.mode,
        locale: 'en',
      });
      const page = await context.newPage();
      await page.addInitScript(
        ([p, m]) => {
          localStorage.setItem('theme-palette', JSON.stringify(p));
          localStorage.setItem('theme-preference', JSON.stringify(m));
          localStorage.removeItem('forced-offline');
        },
        [item.palette, item.mode]
      );

      await page.goto(PLAYER_URL, { waitUntil: 'networkidle', timeout: 60000 });
      await settle(page, item.palette, item.mode);
      await page.waitForSelector('audio#audio', {
        state: 'attached',
        timeout: 30000,
      });
      await page.addStyleTag({
        content: 'nextjs-portal{display:none!important}',
      });

      await page.getByRole('button', { name: 'More options' }).click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(OUT_DIR, `more-${item.name}.png`),
      });
      console.log(`saved more-${item.name}.png`);

      // Start a download to validate the transient floating status.
      if (item.name === 'warm-light') {
        const dialog = page.locator('dialog[open]');
        const download = dialog.getByRole('button', { name: 'Download' });
        if (await download.count()) {
          await download.click();
          await page.waitForTimeout(1200);
          await dialog.getByLabel('Close').click();
          await page.waitForTimeout(600);
          await page.screenshot({
            path: path.join(OUT_DIR, 'download-pill-warm-light.png'),
          });
          console.log('saved download-pill-warm-light.png');
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
