import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3100';
const ROUTE = '/design-preview';
const OUT_DIR = path.join(process.cwd(), 'docs', 'previews', 'phase-0');

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

const combinations = [
  { palette: 'classic', mode: 'light' },
  { palette: 'classic', mode: 'dark' },
  { palette: 'warm', mode: 'light' },
  { palette: 'warm', mode: 'dark' },
  { palette: 'night', mode: 'light' },
  { palette: 'night', mode: 'dark' },
];

async function settle(page, palette, mode) {
  await page.waitForFunction(
    ([expectedPalette, expectedMode]) => {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      return (
        root.dataset.theme === expectedPalette &&
        isDark === (expectedMode === 'dark')
      );
    },
    [palette, mode],
    { timeout: 15000 }
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const { palette, mode } of combinations) {
      const context = await browser.newContext({
        viewport: MOBILE,
        deviceScaleFactor: 2,
        colorScheme: mode,
        locale: 'en',
      });
      const page = await context.newPage();

      await page.addInitScript(
        ([p, m]) => {
          localStorage.setItem('theme-palette', JSON.stringify(p));
          localStorage.setItem('theme-preference', JSON.stringify(m));
        },
        [palette, mode]
      );

      await page.goto(`${BASE_URL}${ROUTE}`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.addStyleTag({
        content: 'nextjs-portal{display:none!important}',
      });
      await settle(page, palette, mode);

      const file = path.join(OUT_DIR, `mobile-${palette}-${mode}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`saved ${file}`);

      await context.close();
    }

    // One desktop frame with the picker and the widest token grid.
    const context = await browser.newContext({
      viewport: DESKTOP,
      deviceScaleFactor: 1,
      colorScheme: 'light',
      locale: 'en',
    });
    const page = await context.newPage();
    await page.addInitScript(
      ([p, m]) => {
        localStorage.setItem('theme-palette', JSON.stringify(p));
        localStorage.setItem('theme-preference', JSON.stringify(m));
      },
      ['warm', 'light']
    );
    await page.goto(`${BASE_URL}${ROUTE}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.addStyleTag({
      content: 'nextjs-portal{display:none!important}',
    });
    await settle(page, 'warm', 'light');
    const desktopFile = path.join(OUT_DIR, 'desktop-warm-light.png');
    await page.screenshot({ path: desktopFile, fullPage: true });
    console.log(`saved ${desktopFile}`);
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
