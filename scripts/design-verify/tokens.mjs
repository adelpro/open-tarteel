/**
 * Design-system token assertion for Task 2.
 *
 * Run against a local `next dev` on http://localhost:3000 (branch `develop`).
 * Exits 1 if any of the five token invariants is violated.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

// Default to the local dev server on 3000. The port is overridable because
// another supervised service may already own 3000 on a shared machine.
const BASE_URL = `http://localhost:${process.env.DESIGN_VERIFY_PORT ?? '3000'}`;
const SRC_DIR = fileURLToPath(new URL('../../src/', import.meta.url));
const failures = [];

/**
 * Static half of (e): the 12px type floor. A browser check alone cannot see
 * an undersized utility that no audited page happens to render, so scan the
 * source tree too. Matches the literal class names, not a regex character
 * class (text-[8px] must mean exactly that string).
 */
function scanUndersizedType(directory) {
  const hits = [];
  const pattern = /text-\[(?:8|10|11)px\]/g;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      hits.push(...scanUndersizedType(path));
    } else if (entry.isFile() && /\.(?:tsx?|jsx?|css|mdx?)$/.test(entry.name)) {
      const text = readFileSync(path, 'utf8');
      for (const match of text.matchAll(pattern)) {
        const line = text.slice(0, match.index).split('\n').length;
        hits.push(`${path.replace(SRC_DIR, 'src/')}:${line} ${match[0]}`);
      }
    }
  }
  return hits;
}

const undersizedType = scanUndersizedType(SRC_DIR);
if (undersizedType.length > 0) {
  failures.push(
    `(e) undersized type utility in src/: ${undersizedType.join(' | ')}`
  );
}
console.log(
  'Static type-floor scan:',
  undersizedType.length === 0
    ? 'PASS (no text-[8px], text-[10px] or text-[11px] in src/)'
    : undersizedType.join(' | ')
);

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);

  const result = await page.evaluate(async () => {
    await document.fonts.ready;

    const describe = (element) =>
      `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 140)}`;

    const shell = document.querySelector('main') ?? document.body;

    // (a) no ambient orbs and no visible blurred filter in the root shell.
    // `filter: blur()` is the real mechanism the orbs used; a backgroundImage
    // check could never see them.
    const orbElements = [...document.querySelectorAll('.ambient-orbs')].map(
      (element) => describe(element)
    );

    const blurredElements = [shell, ...shell.querySelectorAll('*')]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (!style.filter.includes('blur(')) return false;
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }
        return element.getClientRects().length > 0;
      })
      .map((element) => describe(element));

    // (b) no `pulse` animation unless it is explicitly motion-safe
    const pulsingElements = [...document.querySelectorAll('*')]
      .filter((element) => {
        const classes =
          typeof element.className === 'string' ? element.className : '';
        if (classes.includes('motion-safe:')) return false;
        return getComputedStyle(element)
          .animationName.split(',')
          .map((name) => name.trim())
          .includes('pulse');
      })
      .map((element) => describe(element));

    return {
      orbElements,
      blurredElements,
      pulsingElements,
      bodyFontSize: getComputedStyle(document.body).fontSize,
      bodyLineHeight: getComputedStyle(document.body).lineHeight,
    };
  });

  // (c) next/font loads Amiri on demand: `check()` is false on `/` until the
  // face is requested. Force the registered face to load with a sample ayah,
  // then assert it is actually available — no second navigation needed.
  const amiriLoaded = await page.evaluate(async () => {
    await document.fonts.load('28px Amiri', 'قُلْ أَعُوذُ');
    await document.fonts.ready;
    return document.fonts.check('28px Amiri');
  });

  if (result.orbElements.length > 0 || result.blurredElements.length > 0) {
    failures.push(
      `(a) ambient orbs or visible blurred filter found: orbs=[${result.orbElements.join(' | ')}] filters=[${result.blurredElements.join(' | ')}]`
    );
  }
  if (result.pulsingElements.length > 0) {
    failures.push(
      `(b) non-motion-safe pulse animation found: ${result.pulsingElements.join(' | ')}`
    );
  }
  if (amiriLoaded !== true) {
    failures.push(
      '(c) document.fonts.check("28px Amiri") is not true after loading the registered face'
    );
  }
  if (result.bodyFontSize !== '15px') {
    failures.push(
      `(d) body font-size is ${result.bodyFontSize}, expected 15px`
    );
  }

  console.log(
    'Observed:',
    JSON.stringify({ ...result, amiriLoadedAfterRequest: amiriLoaded }, null, 2)
  );
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

console.log(
  'PASS: token assertions (a)-(d) and static type-floor check (e) all satisfied'
);
