/**
 * Design-system primitive assertions for Task 3.
 *
 * Run against a local `next dev` on http://localhost:3000 (branch `develop`).
 * The port is overridable with DESIGN_VERIFY_PORT because another supervised
 * service may already own 3000 on a shared machine.
 *
 * Opens the reciter sheet at /reciter/quran.foundation-13 and asserts:
 *   (a) every visible button shows a focus indicator when focused via
 *       page.focus() — a non-none outline OR the primary ring box-shadow;
 *   (b) no visible interactive element has a tap target under 44px;
 *   (c) every chip (`[data-tag]`) uses one shared 8px border radius;
 *   (d) Tags, Segmented items and touched buttons carry the shared focus-ring
 *       class and resolve to the primary ring colour when focused.
 *
 * Exits 1 if any invariant is violated.
 */
// Use the project's installed Playwright so this works on any machine/CI.
import { readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

const BASE_URL = `http://localhost:${process.env.DESIGN_VERIFY_PORT ?? '3000'}`;
const PAGE_URL = `${BASE_URL}/reciter/quran.foundation-13`;
const failures = [];

// The opener is translated on the Arabic route. Read the live label instead of
// hard-coding the retired English string (same pattern as the other scripts).
const ar = JSON.parse(
  readFileSync(new URL('../../src/locales/ar.json', import.meta.url), 'utf8')
);
const openSelectorLabel = ar['reciter.openSelector'] ?? 'Open reciter selector';

/** `color-mix(in srgb, var(--accent) 35%, …)` resolves to `color(srgb … / 0.35)`. */
function primaryRingInShadow(shadow, accentChannels) {
  if (!shadow || shadow === 'none' || !accentChannels) return false;
  const colors = [...shadow.matchAll(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)\)/gi)];
  return colors.some(
    ([, r, g, b, alpha]) =>
      Math.abs(Number(r) - accentChannels[0]) < 0.01 &&
      Math.abs(Number(g) - accentChannels[1]) < 0.01 &&
      Math.abs(Number(b) - accentChannels[2]) < 0.01 &&
      Math.abs(Number(alpha) - 0.35) < 0.02
  );
}

/** Focus every visible button in `root` and read its computed focus indicator. */
async function collectFocus(page, root) {
  const count = await page.evaluate((rootSelector) => {
    for (const element of document
      .querySelectorAll('[data-dv-btn]')) element.removeAttribute('data-dv-btn');
    const scope = rootSelector ? document.querySelector(rootSelector) : document;
    const buttons = [...scope.querySelectorAll('button')].filter(
      (element) => element.getClientRects().length > 0
    );
    for (const [index, element] of buttons.entries()) element.setAttribute('data-dv-btn', String(index));
    return buttons.length;
  }, root);

  const results = [];
  for (let index = 0; index < count; index += 1) {
    await page.focus(`[data-dv-btn="${index}"]`);
    results.push(
      await page.evaluate((index_) => {
        const element = document.querySelector(`[data-dv-btn="${index_}"]`);
        const style = getComputedStyle(element);
        return {
          label: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 40),
          focused: document.activeElement === element,
          focusVisible: element.matches(':focus-visible'),
          outline: style.outlineStyle,
          boxShadow: style.boxShadow,
        };
      }, index)
    );
  }
  return results;
}

/**
 * (d) The ring must be a real computed style, not just Chromium's native
 * outline. Every Tag, Segmented item and touched button has to carry the
 * shared class, and a focused representative has to resolve to the primary
 * ring colour in its computed box-shadow.
 */
async function assertPrimaryRing(page, accentChannels) {
  // Done in one evaluate: React re-renders can replace nodes between calls,
  // which would drop DOM markers used to address elements later.
  const observed = await page.evaluate(() => {
    const groups = {
      tag: [...document.querySelectorAll('[data-tag]')],
      segmented: [...document.querySelectorAll('[role="group"] > button')],
      button: [...document.querySelectorAll('button.focus-ring')],
    };
    const labelOf = (element) =>
      (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 40);
    const counts = {};
    const missingClass = [];
    const focused = [];
    let hiddenCount = 0;

    for (const [kind, elements] of Object.entries(groups)) {
      counts[kind] = elements.length;
      for (const element of elements) {
        const label = labelOf(element);
        if (!element.classList.contains('focus-ring')) {
          missingClass.push(`${kind} "${label}"`);
        }
        const canFocus =
          element.matches('button, a[href], input, select, textarea, [tabindex]') &&
          element.getClientRects().length > 0;
        if (canFocus) {
          element.focus();
          if (document.activeElement === element) {
            focused.push({
              kind,
              label,
              boxShadow: getComputedStyle(element).boxShadow,
            });
          } else {
            // Inert while a modal dialog is open; covered by the probe below.
            hiddenCount += 1;
          }
        } else {
          hiddenCount += 1;
        }
      }
    }

    // Tags inside closed dialogs cannot receive focus. A visible probe with
    // the same class proves that the class itself produces the ring.
    let probe = null;
    if (hiddenCount > 0) {
      const host = document.querySelector('dialog[open]') ?? document.body;
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'focus-ring';
      element.textContent = 'ring probe';
      host.append(element);
      element.focus();
      probe = {
        isActive: document.activeElement === element,
        boxShadow: getComputedStyle(element).boxShadow,
      };
      element.remove();
    }
    return { counts, missingClass, focused, hiddenCount, probe };
  });

  for (const label of observed.missingClass) {
    failures.push(`(d) ${label} is missing the focus-ring class`);
  }
  for (const state of observed.focused) {
    if (!primaryRingInShadow(state.boxShadow, accentChannels)) {
      failures.push(
        `(d) ${state.kind} "${state.label}" has no primary ring when focused (box-shadow=${state.boxShadow})`
      );
    }
  }
  if (observed.probe && !primaryRingInShadow(observed.probe.boxShadow, accentChannels)) {
    failures.push(
      `(d) focus-ring class does not produce the primary ring when focused (${observed.hiddenCount} hidden Tags; focused=${observed.probe.isActive}, box-shadow=${observed.probe.boxShadow})`
    );
  }

  return observed.counts;
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  // Mobile viewport so the reciter sheet is the dialog variant with a scrim.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(4_000);

  // Keyboard modality first: that makes :focus-visible match page.focus().
  await page.keyboard.press('Tab');

  const accentChannels = await page.evaluate(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim();
    const hex = raw.match(/^#([\da-f]{6})$/i);
    if (hex) {
      const n = parseInt(hex[1], 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const rgb = raw.match(/rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
    return rgb ? [+rgb[1] / 255, +rgb[2] / 255, +rgb[3] / 255] : null;
  });

  // (a) Check the page buttons first: once the modal sheet is open, everything
  // outside it is inert and cannot receive focus.
  const focusResults = await collectFocus(page, null);
  const pageRingRepresentatives = await assertPrimaryRing(page, accentChannels);

  // Now open the reciter sheet and check its buttons too. A click that lands
  // before React hydration silently does nothing, so retry until it opens.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page
      .getByRole('button', { name: openSelectorLabel, exact: false })
      .first()
      .click();
    try {
      await page.waitForSelector('dialog[open]', { timeout: 5_000 });
      break;
    } catch {
      if (attempt === 4) throw new Error('reciter sheet did not open after 5 clicks');
    }
  }
  // The list hydrates from the reciter catalog asynchronously. Wait until its
  // rows are present so the focus assertions cover the real sheet contents.
  await page.waitForFunction(
    () =>
      (document.querySelector('dialog[open]')?.querySelectorAll('button').length ?? 0) >= 50,
    null,
    { timeout: 90_000 }
  );
  await page.waitForTimeout(500);
  await page.keyboard.press('Tab');
  const sheetFocusResults = await collectFocus(page, 'dialog[open]');
  focusResults.push(...sheetFocusResults);

  for (const state of focusResults) {
    const hasOutline = Boolean(state.outline) && state.outline !== 'none';
    const hasRing = primaryRingInShadow(state.boxShadow, accentChannels);
    if (!hasOutline && !hasRing) {
      failures.push(
        `(a) button "${state.label}" has no focus indicator (focused=${state.focused}, focusVisible=${state.focusVisible}, outline=${state.outline}, box-shadow=${state.boxShadow})`
      );
    }
  }

  // (b) Tap-target floor. Checkbox/radio inputs are measured by their label,
  // which is the real hit area; range sliders and the sr-only skip link are
  // intentionally excluded (they are not tap targets).
  const smallTargets = await page.evaluate(() => {
    const visible = (element) =>
      element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
    const selector =
      'button, a[href], input:not([type=hidden]):not([type=range]), select, textarea, [role="button"]';
    return [...document.querySelectorAll(selector)]
      .filter((element) => visible(element))
      .filter((element) => !element.closest('.sr-only') && !element.classList.contains('sr-only'))
      .map((element) => {
        const rect =
          element.matches('input[type=checkbox], input[type=radio]') && element.closest('label')
            ? element.closest('label').getBoundingClientRect()
            : element.getBoundingClientRect();
        return {
          element: `${element.tagName.toLowerCase()}[${(element.getAttribute('aria-label') || element.textContent || element.type || '').trim().slice(0, 40)}]`,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width < 44 || item.height < 44);
  });
  for (const item of smallTargets) {
    failures.push(
      `(b) tap target ${item.element} is ${item.width}x${item.height}, expected at least 44x44`
    );
  }

  // (c) One chip radius. Computed styles are available even inside closed
  // dialogs, so this covers every Tag rendered on the page.
  const chipRadii = await page.evaluate(() =>
    [...new Set(
      [...document.querySelectorAll('[data-tag]')].map(
        (element) => getComputedStyle(element).borderRadius
      )
    )]
  );
  if (chipRadii.length !== 1 || chipRadii[0] !== '8px') {
    failures.push(
      `(c) chip border-radius values are [${chipRadii.join(', ')}], expected a single 8px value`
    );
  }

  // (d) Stricter ring check: (a) alone passes on Chromium's native outline.
  // The modal makes page buttons inert, so check them before it opened too.
  const sheetRingRepresentatives = await assertPrimaryRing(page, accentChannels);
  const ringRepresentatives = Object.fromEntries(
    Object.keys(pageRingRepresentatives).map((kind) => [
      kind,
      pageRingRepresentatives[kind] + sheetRingRepresentatives[kind],
    ])
  );
  // A vacuous set would let a full revert pass, so require members in each group.
  for (const [kind, count] of Object.entries(ringRepresentatives)) {
    if (count === 0) {
      failures.push(`(d) no ${kind} ring representatives found — assertion would be vacuous`);
    }
  }

  console.log(
    'Observed:',
    JSON.stringify(
      {
        url: page.url(),
        sheetOpen: true,
        buttonsChecked: focusResults.length,
        buttonsWithNativeOutline: focusResults.filter((r) => r.outline && r.outline !== 'none').length,
        buttonsWithPrimaryRing: focusResults.filter((r) => primaryRingInShadow(r.boxShadow, accentChannels)).length,
        smallTargets,
        chipRadii,
        ringRepresentatives,
      },
      null,
      2
    )
  );
} catch (error) {
  failures.push(`unexpected error: ${error instanceof Error ? error.stack : error}`);
} finally {
  await browser?.close();
}

if (failures.length > 0) {
  console.error('FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('PASS: primitive assertions (a)-(d) all satisfied');
