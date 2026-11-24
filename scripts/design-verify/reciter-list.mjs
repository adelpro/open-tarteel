/**
 * Reciter sheet density and language assertions for Task 5.
 *
 * Run against a local `next dev`. The port is overridable with
 * DESIGN_VERIFY_PORT because another supervised service may own 3000.
 *
 * Opens the reciter sheet on the Arabic route at 1440px and at 375px and
 * asserts:
 *   (a) the Arabic sheet (and its Filters dialog) contains no English words
 *       from the retired label set: All / Filters / Source / Riwaya /
 *       "Show N reciters";
 *   (b) no reciter row's text occupies more than two visual lines;
 *   (c) the filter and sort triggers are at least 44x44px and the Filters
 *       trigger renders through the shared Tag primitive.
 *
 * Exits 1 if any invariant is violated.
 */
// Use the project's installed Playwright so this works on any machine/CI.
import { readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

const BASE_URL = `http://localhost:${process.env.DESIGN_VERIFY_PORT ?? '3000'}`;
const ROUTE = '/reciter/quran.foundation-13';
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 375, height: 812 },
];
const RETIRED_ENGLISH = /All|Filters|Source|Riwaya|Show \d+ reciters/;
const failures = [];

// Locale-independent openers: the Arabic label once the key exists, the
// pre-translation default while the assertion is still failing.
const ar = JSON.parse(
  readFileSync(new URL('../../src/locales/ar.json', import.meta.url), 'utf8')
);
const openSelectorLabel = ar['reciter.openSelector'] ?? 'Open reciter selector';
const filtersLabel = ar['filters.title'] ?? 'Filters';

/** The sheet is a modal dialog on a phone and a docked aside on desktop. */
const SHEET_SELECTOR = 'dialog[open], aside[aria-label]';

async function openSheet(page) {
  const opener = page
    .getByRole('button', { name: openSelectorLabel, exact: false })
    .first();
  await opener.waitFor({ state: 'visible', timeout: 180_000 });
  // A click before hydration is lost when React regenerates the tree. The list
  // is fetched on the client, so >= 10 rows is a reliable hydration signal.
  await page.waitForFunction(
    () => document.querySelectorAll('ul > li > div > button').length >= 10,
    null,
    { timeout: 300_000 }
  );
  // The desktop aside exists even while closed: require a *visible* sheet
  // with hydrated rows, and retry a click that raced with hydration.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const open = () =>
      page.waitForFunction(
        (selector) =>
          [...document.querySelectorAll(selector)].some(
            (element) =>
              element.getClientRects().length > 0 &&
              element.querySelectorAll('ul > li > div > button').length >= 10
          ),
        SHEET_SELECTOR,
        { timeout: 15_000 }
      );
    try {
      if (await open().catch(() => false)) break;
      await opener.click();
      await open();
      break;
    } catch {
      if (attempt === 2) throw new Error('reciter sheet did not open');
    }
  }
  await page.waitForTimeout(400);
}

let browser;
try {
  browser = await chromium.launch({ headless: true });

  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });
    // This route resolves every reciter provider during SSR; on a loaded
    // machine a cold request can take > 2 minutes. Fail late, not vacuously.
    const response = await page.goto(`${BASE_URL}${ROUTE}`, {
      waitUntil: 'domcontentloaded',
      timeout: 400_000,
    });
    if (response && response.status() >= 400) {
      failures.push(
        `${viewport.name}: ${ROUTE} returned HTTP ${response.status()}`
      );
      await page.close();
      continue;
    }
    await page.waitForTimeout(2_000);
    await openSheet(page);

    // The Filters dialog is part of the surface; open it and read its labels.
    await page
      .getByRole('button', { name: filtersLabel, exact: false })
      .first()
      .click();
    await page.waitForTimeout(300);

    // Read both surfaces in one pass. Locate the sheet by its reciter rows:
    // the Filters dialog is itself a `dialog[open]` nested inside the sheet,
    // so picking the first open dialog would measure the wrong surface.
    const surface = await page.evaluate((retiredSource) => {
      const retired = new RegExp(retiredSource);
      const rowsSelector = 'ul > li > div > button';
      const sheet = [
        ...document.querySelectorAll('dialog[open], aside[aria-label]'),
      ].find((element) => element.querySelectorAll(rowsSelector).length >= 10);
      const dialog = [...document.querySelectorAll('dialog[open]')].find(
        (element) => element.querySelector('ul input[type="checkbox"]')
      );

      // (a) One language per surface: no retired English default messages.
      const englishInSheet =
        (sheet?.innerText ?? '').match(retired)?.[0] ?? null;
      const englishInFilters =
        (dialog?.innerText ?? '').match(retired)?.[0] ?? null;

      // (b) Row density: text bands, not element count. Two text nodes on one
      // line share a band, so a wrapped name adds a third band.
      const rows = sheet ? [...sheet.querySelectorAll(rowsSelector)] : [];
      const detailed = rows.map((button) => {
        const block = button.firstElementChild;
        if (!block) return { label: '', lines: 0 };
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        const tops = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.height > 0) tops.push(rect.top);
          }
        }
        const bands = [];
        for (const top of tops.sort((a, b) => a - b)) {
          if (!bands.some((band) => Math.abs(band - top) <= 2)) bands.push(top);
        }
        return {
          label: (button.textContent || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 48),
          lines: bands.length,
        };
      });

      // (c) Filter and sort are the two buttons in the secondary toolbar row.
      const filters = sheet?.querySelector('[aria-haspopup="dialog"]');
      const row = filters?.parentElement;
      // The Filters dialog is a sibling of its trigger, so measure only the
      // row's own buttons — not the dialog's close / footer controls.
      const buttons = row ? [...row.querySelectorAll(':scope > button')] : [];
      const measure = (button) => {
        const rect = button.getBoundingClientRect();
        return {
          label: (button.textContent || '').trim().slice(0, 24),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      };
      return {
        englishInSheet,
        englishInFilters,
        hasFilterDialog: Boolean(dialog),
        rows: detailed.length,
        worst: detailed
          .filter((item) => item.lines > 2)
          .sort((a, b) => b.lines - a.lines)
          .slice(0, 5),
        triggers: {
          count: buttons.length,
          triggers: buttons.map((button) => measure(button)),
          filtersUsesTag: Boolean(filters?.querySelector('[data-tag]')),
        },
      };
    }, RETIRED_ENGLISH.source);

    const { englishInSheet, englishInFilters, triggers } = surface;
    const rowReport = { rows: surface.rows, worst: surface.worst };
    if (!surface.hasFilterDialog) {
      failures.push(`${viewport.name}: the Filters dialog did not open`);
    }

    // Close the filter dialog without changing filters.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    console.log(
      `${viewport.name} ${viewport.width}x${viewport.height}:`,
      JSON.stringify({
        englishInSheet,
        englishInFilters,
        rows: rowReport.rows,
        rowsOverTwoLines: rowReport.worst,
        triggers,
      })
    );

    if (rowReport.rows < 10) {
      failures.push(
        `${viewport.name} (b) only ${rowReport.rows} reciter rows found, expected the hydrated list`
      );
    }
    for (const row of rowReport.worst) {
      failures.push(
        `${viewport.name} (b) reciter row "${row.label}" uses ${row.lines} visual lines, max 2`
      );
    }
    for (const trigger of triggers.triggers) {
      if (trigger.height < 44 || trigger.width < 44) {
        failures.push(
          `${viewport.name} (c) trigger "${trigger.label}" is ${trigger.width}x${trigger.height}, expected at least 44x44`
        );
      }
    }
    if (triggers.count < 2) {
      failures.push(
        `${viewport.name} (c) found ${triggers.count} filter/sort triggers, expected 2`
      );
    }
    if (!triggers.filtersUsesTag) {
      failures.push(
        `${viewport.name} (c) the Filters trigger does not use Tag`
      );
    }
    if (englishInSheet) {
      failures.push(
        `${viewport.name} (a) Arabic sheet contains English label "${englishInSheet}"`
      );
    }
    if (englishInFilters) {
      failures.push(
        `${viewport.name} (a) Arabic Filters dialog contains English label "${englishInFilters}"`
      );
    }

    await page.close();
  }
} catch (error) {
  failures.push(
    `unexpected error: ${error instanceof Error ? error.stack : error}`
  );
} finally {
  await browser?.close();
}

if (failures.length > 0) {
  console.error('FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('PASS: reciter list assertions (a)-(c) all satisfied');
