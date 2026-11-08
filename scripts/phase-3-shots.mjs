import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';
const OUT_DIR = path.join(process.cwd(), 'docs', 'previews', 'phase-3');
const PLAYER_URL = `${BASE_URL}/reciter/mp3quran.net-1?moshafId=1`;
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

const cases = [
  {
    name: 'passive-classic-light',
    palette: 'classic',
    mode: 'light',
    forced: false,
    viewport: MOBILE,
  },
  {
    name: 'forced-warm-light',
    palette: 'warm',
    mode: 'light',
    forced: true,
    viewport: MOBILE,
  },
  {
    name: 'forced-night-dark',
    palette: 'night',
    mode: 'dark',
    forced: true,
    viewport: MOBILE,
  },
  {
    name: 'passive-classic-dark-desktop',
    palette: 'classic',
    mode: 'dark',
    forced: false,
    viewport: DESKTOP,
  },
  {
    name: 'forced-warm-light-desktop',
    palette: 'warm',
    mode: 'light',
    forced: true,
    viewport: DESKTOP,
  },
];

async function prime(page, palette, mode, forced) {
  await page.addInitScript(
    ([p, m, f]) => {
      localStorage.setItem('theme-palette', JSON.stringify(p));
      localStorage.setItem('theme-preference', JSON.stringify(m));
      if (f) localStorage.setItem('forced-offline', JSON.stringify(true));
      else localStorage.removeItem('forced-offline');
    },
    [palette, mode, forced]
  );
}

async function settle(page, palette, mode) {
  await page.waitForFunction(
    ([expectedPalette, expectedMode]) => {
      const root = document.documentElement;
      return (
        root.dataset.theme === expectedPalette &&
        root.classList.contains('dark') === (expectedMode === 'dark')
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
        deviceScaleFactor: item.viewport === MOBILE ? 2 : 1,
        colorScheme: item.mode,
        locale: 'en',
      });
      const page = await context.newPage();
      await prime(page, item.palette, item.mode, item.forced);
      await page.goto(PLAYER_URL, { waitUntil: 'networkidle', timeout: 60000 });
      await settle(page, item.palette, item.mode);

      if (!item.forced) {
        await page.waitForSelector('audio#audio', {
          state: 'attached',
          timeout: 30000,
        });
        await context.setOffline(true);
      }

      await page.locator('aside[role="status"]').waitFor({
        state: 'visible',
        timeout: 15000,
      });
      await page.addStyleTag({
        content: 'nextjs-portal{display:none!important}',
      });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUT_DIR, `${item.name}.png`),
      });
      console.log(`saved ${item.name}.png`);
      await context.close();
    }

    // Fullscreen variants
    for (const item of [
      {
        name: 'fullscreen-passive-night-dark',
        palette: 'night',
        mode: 'dark',
        forced: false,
      },
      {
        name: 'fullscreen-forced-warm-light',
        palette: 'warm',
        mode: 'light',
        forced: true,
      },
    ]) {
      const context = await browser.newContext({
        viewport: MOBILE,
        deviceScaleFactor: 2,
        colorScheme: item.mode,
        locale: 'en',
      });
      const page = await context.newPage();
      await prime(page, item.palette, item.mode, item.forced);
      await page.goto(PLAYER_URL, { waitUntil: 'networkidle', timeout: 60000 });
      await settle(page, item.palette, item.mode);

      if (!item.forced) {
        await page.waitForSelector('audio#audio', {
          state: 'attached',
          timeout: 30000,
        });
        await context.setOffline(true);
      }

      await page.locator('[aria-label="More options"]').click();
      await page.waitForTimeout(250);
      // The menu is clipped on small screens in this phase; invoke the control.
      await page
        .locator('button:has-text("Enter fullscreen")')
        .first()
        .evaluate((element) => element.click());
      await page.waitForTimeout(1200);
      await page.addStyleTag({
        content: 'nextjs-portal{display:none!important}',
      });
      await page.screenshot({
        path: path.join(OUT_DIR, `${item.name}.png`),
      });
      console.log(`saved ${item.name}.png`);
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
