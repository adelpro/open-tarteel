/**
 * Dump the rendered DOM of the eight audited pages into a temporary directory
 * for the impeccable design detector. Never writes into the repo.
 *
 * Usage: node scripts/design-verify/dump-dom.mjs <output-dir>
 */
import { mkdirSync,readFileSync, writeFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

const out = process.argv[2];
if (!out) { console.error('usage: dump-dom.mjs <output-dir>'); process.exit(2); }
mkdirSync(out, { recursive: true });

const PORT = process.env.DESIGN_VERIFY_PORT ?? '3100';
const BASE = `http://localhost:${PORT}`;
const PAGES = {
  home: '/',
  reciter: '/reciter/quran.foundation-13',
  followAlong: '/design-preview/follow-along',
  designPreview: '/design-preview',
  settings: '/settings',
  offline: '/offline',
  about: '/about',
  en: '/en',
};

const dumpHelper =
  process.env.DOM_DUMP_HELPER ??
  '/home/adelpro/.claude/skills/gstack/lib/dom-dump.js';
const dumpFunction = readFileSync(dumpHelper, 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, path] of Object.entries(PAGES)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(1500);
    const html = await page.evaluate(`(${dumpFunction})()`);
    writeFileSync(`${out}/${name}.dom.html`, html, 'utf8');
    console.log(`dumped ${name}`);
    await page.close();
  }
} finally {
  await browser.close();
}
