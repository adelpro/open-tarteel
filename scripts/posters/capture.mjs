import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

/**
 * Stores screenshots for the follow-along release.
 *
 * Captures full-resolution PNGs of the running app, one per screen per device
 * family. Everything here is a browser screenshot at the family's native pixel
 * size; capture-flow's build step does the framing and the resizing.
 */
const BASE = process.env.POSTERS_BASE ?? 'https://staging-tarteel.quran.us.kg';
const OUT = path.join(import.meta.dirname, 'captures');

/** CSS viewport × deviceScaleFactor gives the native store pixel size. */
const FAMILIES = {
  iphone: { width: 440, height: 956, deviceScaleFactor: 3 },
  ipad: { width: 768, height: 1024, deviceScaleFactor: 2.6875 },
  'android-phone': { width: 360, height: 640, deviceScaleFactor: 3 },
  'android-tablet': { width: 800, height: 1280, deviceScaleFactor: 2 },
};

const SCREENS = [
  {
    name: '01',
    path: '/design-preview/follow-along',
    // The ayah line only exists once the surah JSON has landed.
    ready: '[aria-label="الآية 1"]',
  },
  {
    name: '02',
    path: '/settings',
    ready: 'text=السطر القرآني',
    prepare: async (page) => {
      // Open the availability disclosure: that is the slide's subject.
      await page.getByLabel('أين يعمل السطر').click();
      await page.waitForTimeout(400);
    },
  },
  {
    name: '03',
    path: '/',
    ready: 'text=الصفحة الرئيسية',
  },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

for (const [family, viewport] of Object.entries(FAMILIES)) {
  for (const screen of SCREENS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      locale: 'ar',
    });
    const page = await context.newPage();

    await page.goto(`${BASE}${screen.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForSelector(screen.ready, { timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    // Let hydration and the first paint settle, so the shot is not a skeleton.
    await page.waitForTimeout(1200);

    if (screen.prepare) await screen.prepare(page);

    const file = path.join(OUT, `${family}-${screen.name}.png`);
    await page.screenshot({ path: file });
    console.log(`${family}-${screen.name}.png`);
    await context.close();
  }
}

await browser.close();
