import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

/**
 * Raw captures for the Itqan community article about Tarteel 2.0 (beta).
 *
 * All shots come from the live staging build. We capture at each device
 * family's native pixel size; capture-flow's build step owns framing, Arabic
 * type, and resize. No dev tooling or consent chrome is left in the frame.
 */
const BASE = process.env.ITQAN_BASE ?? 'https://staging-tarteel.quran.us.kg';
const OUT = path.join(import.meta.dirname, 'captures');

/** CSS viewport × deviceScaleFactor = native store pixel size. */
const FAMILIES = {
  iphone: { width: 440, height: 956, deviceScaleFactor: 3 },
  mac: { width: 1440, height: 900, deviceScaleFactor: 2 },
};

const SCREENS = [
  {
    name: '01-follow',
    path: '/design-preview/follow-along',
    ready: '[aria-label="الآية 1"]',
  },
  {
    name: '02-sources',
    path: '/settings',
    ready: 'text=مصادر القراء',
  },
  {
    name: '03-reciters',
    path: '/',
    ready: 'button[aria-label="Open reciter selector"]',
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Open reciter selector' }).click();
      // The filter dialog is always in the DOM; wait for the visible sheet and
      // a real reciter row, not for a badge span that may be in a closed panel.
      await page
        .getByRole('searchbox')
        .first()
        .waitFor({ state: 'visible', timeout: 30_000 });
      await page
        .locator('li button')
        .first()
        .waitFor({ state: 'visible', timeout: 30_000 });
      await page.waitForTimeout(800);
    },
  },
  {
    name: '04-appearance',
    path: '/settings',
    ready: 'text=لوحة ألوان',
  },
  {
    name: '05-offline',
    path: '/offline',
    ready: 'text=لا يوجد اتصال بالإنترنت',
  },
];

/** Netlify's draft-deploy badge occasionally overlays the screenshot. */
const HIDE_CHROME = `
  iframe[title*="Netlify"], [class*="netlify-badge"], [id*="netlify-badge"] {
    display: none !important;
  }
`;

const hideChrome = async (page) => {
  await page.addStyleTag({ content: HIDE_CHROME });
  await page.evaluate(() => {
    for (const node of document.querySelectorAll('body *')) {
      if (
        node.children.length === 0 &&
        /Powered by Netlify/i.test(node.textContent || '')
      ) {
        (node.closest('div, a') ?? node).style.setProperty(
          'display',
          'none',
          'important'
        );
      }
    }
  });
};

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

    try {
      await page.goto(`${BASE}${screen.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForSelector(screen.ready, { timeout: 60_000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      await hideChrome(page);
      if (screen.prepare) await screen.prepare(page);
      await hideChrome(page);

      const file = path.join(OUT, `${family}-${screen.name}.png`);
      await page.screenshot({ path: file });
      console.log(`${family}-${screen.name}.png`);
    } catch (error) {
      console.error(`FAILED ${family}-${screen.name}: ${error.message}`);
      process.exitCode = 1;
    } finally {
      await context.close();
    }
  }
}

await browser.close();
