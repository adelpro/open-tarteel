import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';
const OUT_DIR = path.join(process.cwd(), 'docs', 'previews', 'phase-1');
const MOBILE = { width: 390, height: 844 };

const palettes = [
  { palette: 'classic', mode: 'light' },
  { palette: 'classic', mode: 'dark' },
  { palette: 'warm', mode: 'light' },
  { palette: 'warm', mode: 'dark' },
  { palette: 'night', mode: 'light' },
  { palette: 'night', mode: 'dark' },
];

const selectorCombos = [
  { palette: 'classic', mode: 'light' },
  { palette: 'warm', mode: 'light' },
  { palette: 'night', mode: 'dark' },
];

async function prime(page, palette, mode) {
  await page.addInitScript(
    ([p, m]) => {
      localStorage.setItem('theme-palette', JSON.stringify(p));
      localStorage.setItem('theme-preference', JSON.stringify(m));
    },
    [palette, mode]
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
  await page.waitForTimeout(500);
}

async function newPage(browser, palette, mode) {
  const context = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    colorScheme: mode,
    locale: 'en',
  });
  const page = await context.newPage();
  await prime(page, palette, mode);
  return { context, page };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    // Tag matrix, cropped to the component sample.
    for (const { palette, mode } of palettes) {
      const { context, page } = await newPage(browser, palette, mode);
      await page.goto(`${BASE_URL}/design-preview`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.addStyleTag({
        content:
          'nextjs-portal{display:none!important}footer{display:none!important}',
      });
      await settle(page, palette, mode);
      await page.locator('[data-shot="tags"]').screenshot({
        path: path.join(OUT_DIR, `tags-${palette}-${mode}.png`),
      });
      console.log(`saved tags-${palette}-${mode}.png`);
      await context.close();
    }

    // Real reciter sheet with the unified tags.
    for (const { palette, mode } of selectorCombos) {
      const { context, page } = await newPage(browser, palette, mode);
      await page.goto(`${BASE_URL}/`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.addStyleTag({
        content: 'nextjs-portal{display:none!important}',
      });
      await settle(page, palette, mode);
      const later = page.getByRole('button', { name: 'Later' });
      if (await later.count()) {
        await later.click().catch(() => {});
      }
      await page.getByLabel('Open reciter selector').click();
      await page
        .locator('input[type="search"]')
        .waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(900);
      await page.mouse.move(2, 2);
      await page.waitForTimeout(250);
      await page.screenshot({
        path: path.join(OUT_DIR, `selector-${palette}-${mode}.png`),
      });
      console.log(`saved selector-${palette}-${mode}.png`);

      await page.getByRole('button', { name: /^Filters/ }).click();
      await page.waitForTimeout(700);
      await page.screenshot({
        path: path.join(OUT_DIR, `filters-${palette}-${mode}.png`),
      });
      console.log(`saved filters-${palette}-${mode}.png`);
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
