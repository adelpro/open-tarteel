import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';
const OUT_DIR = path.join(process.cwd(), 'docs', 'previews', 'phase-5');

const cases = [
  {
    name: 'warm-light',
    palette: 'warm',
    mode: 'light',
    viewport: { width: 390, height: 844 },
    scale: 2,
  },
  {
    name: 'warm-dark',
    palette: 'warm',
    mode: 'dark',
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
    name: 'classic-light',
    palette: 'classic',
    mode: 'light',
    viewport: { width: 390, height: 844 },
    scale: 2,
  },
  {
    name: 'warm-light-desktop',
    palette: 'warm',
    mode: 'light',
    viewport: { width: 1280, height: 900 },
    scale: 1,
  },
];

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
        },
        [item.palette, item.mode]
      );
      await page.goto(`${BASE_URL}/settings`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForFunction(
        ([p, m]) => {
          const root = document.documentElement;
          return (
            root.dataset.theme === p &&
            root.classList.contains('dark') === (m === 'dark')
          );
        },
        [item.palette, item.mode],
        { timeout: 15000 }
      );
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content:
          'nextjs-portal{display:none!important} footer{display:none!important}',
      });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(OUT_DIR, `settings-${item.name}.png`),
        fullPage: true,
      });
      console.log(`saved settings-${item.name}.png`);
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
