/**
 * Mobile shell and follow-along assertions for Task 6.
 *
 * Run against a local `next dev`; the port is overridable with
 * DESIGN_VERIFY_PORT because another supervised service may own 3000.
 *
 * At 375px:
 *   (a) the document does not scroll sideways;
 *   (b) all five footer links render and have >= 44px hit areas;
 *   (c) the footer is in normal flow and nothing paints over its box;
 *   (d) every legend *text* node (inside Tag) is >= 12px, swatches use Tag;
 *   (e) word transitions use only the 120/180/240ms motion tokens;
 *   (f) footer top >= main content bottom at both scroll positions and with
 *       the reciter sheet open (guards the -mb-20 / pb-20 pairing);
 *   (g) with the reciter sheet docked, the footer never paints over it.
 *
 * Exits 1 if any invariant is violated.
 */
// Use the project's installed Playwright so this works on any machine/CI.
import { readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

const BASE_URL = `http://localhost:${process.env.DESIGN_VERIFY_PORT ?? '3000'}`;
const PREVIEW_ROUTE = '/design-preview/follow-along';
const RECITER_ROUTE = '/reciter/quran.foundation-13';
const VIEWPORT = { width: 375, height: 812 };
const MOTION_TOKENS = new Set(['0.12s', '0.18s', '0.24s']);
const SHEET_SELECTOR = 'dialog[open], aside[aria-label]';
const ROW_SELECTOR = 'ul > li > div > button';
const failures = [];

// Locale-independent openers: the Arabic label once the key exists, the
// pre-translation default while an assertion is still failing.
const ar = JSON.parse(
  readFileSync(new URL('../../src/locales/ar.json', import.meta.url), 'utf8')
);
const openSelectorLabel = ar['reciter.openSelector'] ?? 'Open reciter selector';

/** Copied from reciter-list.mjs: a click before hydration is lost to React. */
async function openReciterSheet(page) {
  const opener = page
    .getByRole('button', { name: openSelectorLabel, exact: false })
    .first();
  await opener.waitFor({ state: 'visible', timeout: 180_000 });
  await page.waitForFunction(
    (selector) => document.querySelectorAll(selector).length >= 10,
    ROW_SELECTOR,
    { timeout: 300_000 }
  );
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const open = () =>
      page.waitForFunction(
        ([selector, rows]) =>
          [...document.querySelectorAll(selector)].some(
            (element) =>
              element.getClientRects().length > 0 &&
              element.querySelectorAll(rows).length >= 10
          ),
        [SHEET_SELECTOR, ROW_SELECTOR],
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

/** One DOM read. Runs on the preview route and on the reciter/sheet route. */
async function measure(page) {
  return page.evaluate(
    ({ rowSelector, sheetSelector }) => {
      const footer = document.querySelector('footer');
      const links = footer ? [...footer.querySelectorAll('a')] : [];
      const legend = document.querySelector(
        'ul[aria-label="أحكام التجويد"], ul[aria-label="Tajweed rules"]'
      );
      const legendItems = legend ? [...legend.querySelectorAll('li')] : [];
      const word = document.querySelector('[data-state]');
      const main = document.querySelector('main');

      const footerRect = footer?.getBoundingClientRect();
      const mainRect = main?.getBoundingClientRect();
      const mainPaddingBottom = main
        ? Number.parseFloat(getComputedStyle(main).paddingBottom) || 0
        : 0;

      const describe = (element) => {
        const className =
          typeof element.className === 'string' ? element.className : '';
        return `${element.tagName.toLowerCase()}.${className.slice(0, 60)}`;
      };

      // (a) A single 375px viewport must not widen the layout.
      const scrollWidth = document.documentElement.scrollWidth;

      // (b) CSS-visible (rendered) links with real hit areas.
      const linkInfo = links.map((link) => {
        const rect = link.getBoundingClientRect();
        const style = getComputedStyle(link);
        return {
          label: (link.textContent || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 24),
          href: link.getAttribute('href'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible:
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width > 0 &&
            rect.height > 0,
        };
      });

      // (c) Who actually paints above a point. Anything other than the footer
      // or its descendants is a badge/sheet covering it (no sheet open here).
      const overlays = new Set();
      if (footerRect) {
        const probe = (x, y) => {
          if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight)
            return null;
          const element = document.elementFromPoint(x, y);
          if (!element || element === footer || footer.contains(element)) {
            return null;
          }
          return describe(element);
        };
        for (const link of links) {
          const rect = link.getBoundingClientRect();
          const hit = probe(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          );
          if (hit) overlays.add(hit);
        }
        for (const fraction of [0.1, 0.3, 0.5, 0.7, 0.9]) {
          const hit = probe(
            footerRect.left + footerRect.width * fraction,
            footerRect.top + footerRect.height / 2
          );
          if (hit) overlays.add(hit);
        }
      }

      // (d) Measure the *text* element inside each Tag, not the wrapping <li>.
      // A future Tag font below 12px must fail even if the li still inherits
      // a 12px floor from elsewhere.
      const legendText = legendItems.flatMap((item) => {
        const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
        const found = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = (node.textContent || '').trim();
          if (!text || !node.parentElement) continue;
          found.push({
            text: text.slice(0, 24),
            fontSize: getComputedStyle(node.parentElement).fontSize,
          });
        }
        return found;
      });
      const legendTagSwatches = legendItems.filter((item) =>
        item.querySelector('[data-tag]')
      ).length;

      // (e) Motion tokens only, never a one-off duration.
      const wordTransition = word
        ? getComputedStyle(word).transitionDuration
        : null;

      // (f) The footer's -mb-20 must consume <main>'s pb-20 exactly: the footer
      // may never start above the end of main's content box.
      const geometry = {
        scrollY: Math.round(scrollY),
        footerTop: footerRect ? Math.round(footerRect.top) : null,
        mainContentBottom: mainRect
          ? Math.round(mainRect.bottom - mainPaddingBottom)
          : null,
        mainPaddingBottom,
      };

      // (g) With a docked sheet open, sample the footer/sheet intersection and
      // require the sheet (not the footer) to own every hit.
      const sheet = [...document.querySelectorAll(sheetSelector)].find(
        (element) => element.querySelectorAll(rowSelector).length >= 10
      );
      const sheetRect = sheet?.getBoundingClientRect();
      const paintedOverSheet = new Set();
      let sheetProbes = 0;
      if (sheetRect && footerRect) {
        const left = Math.max(footerRect.left, sheetRect.left);
        const right = Math.min(footerRect.right, sheetRect.right);
        const top = Math.max(footerRect.top, sheetRect.top);
        const bottom = Math.min(footerRect.bottom, sheetRect.bottom);
        if (right > left && bottom > top) {
          for (const fx of [0.2, 0.5, 0.8]) {
            for (const fy of [0.2, 0.5, 0.8]) {
              sheetProbes += 1;
              const hit = document.elementFromPoint(
                left + (right - left) * fx,
                top + (bottom - top) * fy
              );
              if (hit && (hit === footer || footer.contains(hit))) {
                paintedOverSheet.add(describe(hit));
              }
            }
          }
        }
      }

      return {
        scrollWidth,
        linkInfo,
        footerPosition: footer ? getComputedStyle(footer).position : null,
        footerBox: footerRect
          ? {
              top: Math.round(footerRect.top),
              bottom: Math.round(footerRect.bottom),
            }
          : null,
        overlays: [...overlays],
        legendItemCount: legendItems.length,
        legendText,
        legendTagSwatches,
        wordTransition,
        geometry,
        sheetFound: Boolean(sheet),
        sheetBox: sheetRect
          ? {
              top: Math.round(sheetRect.top),
              bottom: Math.round(sheetRect.bottom),
            }
          : null,
        sheetProbes,
        paintedOverSheet: [...paintedOverSheet],
      };
    },
    { rowSelector: ROW_SELECTOR, sheetSelector: SHEET_SELECTOR }
  );
}

/** (f) one guard, reused at every measured scroll position. */
function checkPaddingCoupling(state, observed) {
  const { footerTop, mainContentBottom } = observed.geometry;
  if (footerTop == null || mainContentBottom == null) {
    failures.push(
      `(${state})(f) footer or main missing, cannot check padding coupling`
    );
    return;
  }
  if (footerTop < mainContentBottom - 1) {
    failures.push(
      `(${state})(f) footer top ${footerTop}px is above main content bottom ${mainContentBottom}px; the -mb-20 / pb-20 pairing broke`
    );
  }
}

let browser;
try {
  browser = await chromium.launch({ headless: true });

  // ── State 1: follow-along preview at 375px, top and scrolled bottom ──
  const page = await browser.newPage({ viewport: VIEWPORT });
  const response = await page.goto(`${BASE_URL}${PREVIEW_ROUTE}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  if (response && response.status() >= 400) {
    failures.push(
      `(setup) ${PREVIEW_ROUTE} returned HTTP ${response.status()}`
    );
  }
  // The legend is server-rendered; words need the client fetch. A cold
  // `next dev` compile can be slow, so wait on hydration not a fixed delay.
  await page
    .waitForSelector('[data-state]', { timeout: 120_000 })
    .catch(() => undefined);

  const top = await measure(page);
  // Both 375px routes fit 812px exactly, so there is no native scroll range.
  // Append a temporary spacer *after* the footer (outside <main>, so the
  // footer/main geometry under test is untouched) to reach a genuine second
  // scroll position, then remove it.
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.id = 'design-verify-scroll-spacer';
    spacer.style.height = '800px';
    document.body.appendChild(spacer);
  });
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight)
  );
  await page.waitForTimeout(200);
  const bottom = await measure(page);
  if (bottom.geometry.scrollY <= top.geometry.scrollY) {
    failures.push(
      '(f) preview never reached a distinct second scroll position'
    );
  }
  await page.evaluate(() =>
    document.getElementById('design-verify-scroll-spacer')?.remove()
  );

  console.log('preview top:', JSON.stringify(top, null, 2));
  console.log('preview bottom:', JSON.stringify(bottom.geometry, null, 2));

  checkPaddingCoupling('preview-top', top);
  checkPaddingCoupling('preview-bottom', bottom);

  if (top.scrollWidth !== 375) {
    failures.push(
      `(a) documentElement.scrollWidth is ${top.scrollWidth}, expected 375`
    );
  }

  if (top.linkInfo.length !== 5) {
    failures.push(`(b) found ${top.linkInfo.length} footer links, expected 5`);
  }
  for (const link of top.linkInfo) {
    if (!link.visible) {
      failures.push(`(b) footer link "${link.label}" is not visible`);
    }
    if (link.width < 44 || link.height < 44) {
      failures.push(
        `(b) footer link "${link.label}" is ${link.width}x${link.height}, expected at least 44x44`
      );
    }
  }

  if (top.footerPosition === 'fixed') {
    failures.push(
      '(c) the footer is position:fixed; it must sit in normal flow so it reserves its own height'
    );
  }
  if (top.overlays.length > 0) {
    failures.push(
      `(c) elements paint over the footer: ${top.overlays.join(' | ')}`
    );
  }

  if (top.legendItemCount === 0) {
    failures.push('(d) no follow-along legend items found');
  }
  if (top.legendText.length !== top.legendItemCount) {
    failures.push(
      `(d) found ${top.legendText.length} legend text nodes for ${top.legendItemCount} items`
    );
  }
  for (const entry of top.legendText) {
    if (Number.parseFloat(entry.fontSize) < 12) {
      failures.push(
        `(d) legend text "${entry.text}" inside Tag is ${entry.fontSize}, expected at least 12px`
      );
    }
  }
  if (
    top.legendItemCount > 0 &&
    top.legendTagSwatches !== top.legendItemCount
  ) {
    failures.push(
      `(d) only ${top.legendTagSwatches}/${top.legendItemCount} legend swatches use Tag`
    );
  }

  if (!top.wordTransition) {
    failures.push('(e) no follow-along word found to measure transitions');
  } else {
    const bad = top.wordTransition
      .split(',')
      .map((value) => value.trim())
      .filter((value) => !MOTION_TOKENS.has(value));
    if (bad.length > 0) {
      failures.push(
        `(e) word transition durations [${bad.join(', ')}] are not motion tokens 120/180/240ms`
      );
    }
  }
  await page.close();

  // ── State 2: reciter sheet docked at 375px ──
  const sheetPage = await browser.newPage({ viewport: VIEWPORT });
  const sheetResponse = await sheetPage.goto(`${BASE_URL}${RECITER_ROUTE}`, {
    waitUntil: 'domcontentloaded',
    timeout: 400_000,
  });
  if (sheetResponse && sheetResponse.status() >= 400) {
    failures.push(
      `(setup) ${RECITER_ROUTE} returned HTTP ${sheetResponse.status()}`
    );
  }
  await openReciterSheet(sheetPage);
  const withSheet = await measure(sheetPage);
  console.log('reciter sheet open:', JSON.stringify(withSheet, null, 2));

  checkPaddingCoupling('reciter-sheet', withSheet);
  if (!withSheet.sheetFound) {
    failures.push('(g) no open reciter sheet with hydrated rows found');
  }
  if (withSheet.sheetProbes === 0) {
    failures.push(
      '(g) the footer and docked sheet do not intersect; sheet layering was not exercised'
    );
  }
  if (withSheet.paintedOverSheet.length > 0) {
    failures.push(
      `(g) the footer paints over the docked sheet: ${withSheet.paintedOverSheet.join(' | ')}`
    );
  }
  await sheetPage.close();
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

console.log('PASS: shell assertions (a)-(g) all satisfied');
