/**
 * Player, spectrum and scripture assertions for Task 4.
 *
 * Run against a local `next dev`. The port is overridable with
 * DESIGN_VERIFY_PORT because another supervised service may own 3000.
 *
 * At `/` and `/reciter/quran.foundation-13`:
 *   (a) the player card's desktop max-width is 512px (max-w-lg);
 *   (b) the transport row has at most five direct children;
 *   (d) no fixed 210px wrapper encloses the player.
 *
 * Scripture (c) is checked on the internal follow-along preview, the only
 * route that renders ayah text without a feature flag, a play gesture and a
 * provider fetch:
 *   (c) the ayah line has a non-empty box, uses an actually available face,
 *       and never names the fictional "Amiri Quran" face.
 *
 * Exits 1 if any invariant is violated.
 */
// Use the project's installed Playwright so this works on any machine/CI.
import { chromium } from '@playwright/test';

const BASE_URL = `http://localhost:${process.env.DESIGN_VERIFY_PORT ?? '3000'}`;
const ROUTES = ['/', '/reciter/quran.foundation-13'];
const SCRIPTURE_ROUTE = '/design-preview/follow-along';
const failures = [];

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  for (const route of ROUTES) {
    // Bounded to 90s: enough for a cold provider fetch, but a missing player
    // now fails in at most ~2.5 minutes instead of ten.
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    if (response && response.status() >= 400) {
      failures.push(`${route} returned HTTP ${response.status()}`);
      continue;
    }
    // The reciter route mounts the player dynamically; wait briefly for the
    // real audio element, then record (rather than throw) if it never appears.
    if (route === '/reciter/quran.foundation-13') {
      try {
        await page.waitForSelector('#audio', { timeout: 45000 });
      } catch {
        // Recorded as a missing card below.
      }
    }
    await page.waitForTimeout(1000);

    const result = await page.evaluate(async () => {
      await document.fonts.ready;

      const describe = (element) =>
        `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 100)}`;

      const findCard = () => {
        const explicit = document.querySelector('[data-player-card]');
        if (explicit) return explicit;
        const audio = document.getElementById('audio');
        if (!audio) return null;
        let node = audio.parentElement;
        while (node && node !== document.body) {
          const classes =
            typeof node.className === 'string' ? node.className : '';
          if (classes.includes('bg-surface') && classes.includes('border')) {
            return node;
          }
          node = node.parentElement;
        }
        return null;
      };

      const findTransport = () => {
        const explicit = document.querySelector('[data-transport]');
        if (explicit) return explicit;
        const play = document.querySelector(
          'button[aria-label="Play"], button[aria-label="Pause"]'
        );
        if (!play) return null;
        let node = play.parentElement;
        while (node && node !== document.body) {
          const classes =
            typeof node.className === 'string' ? node.className : '';
          if (
            classes.includes('justify-between') &&
            classes.includes('w-full')
          ) {
            return node;
          }
          node = node.parentElement;
        }
        return null;
      };

      const card = findCard();
      const transport = findTransport();
      const transportControls = transport
        ? [...transport.querySelectorAll('button')]
            .filter((button) => button.getClientRects().length > 0)
            .map((button) => {
              const rect = button.getBoundingClientRect();
              return {
                label: button.getAttribute('aria-label') || '',
                size: Math.round(rect.width),
              };
            })
        : [];
      const fixedHeightWrappers = [...document.querySelectorAll('main *')]
        .filter((element) => {
          const style = getComputedStyle(element);
          return style.height === '210px' || style.minHeight === '210px';
        })
        .map((element) => describe(element));

      return {
        route: location.pathname,
        cardFound: Boolean(card),
        cardMaxWidth: card ? getComputedStyle(card).maxWidth : null,
        cardWidth: card ? Math.round(card.getBoundingClientRect().width) : null,
        transportFound: Boolean(transport),
        transportChildren: transport ? transport.children.length : null,
        transportControls,
        fixedHeightWrappers,
      };
    });

    console.log(`${route}:`, JSON.stringify(result));

    // (a) Only the reciter route mounts the player. `/` legitimately shows the
    // reciter selector instead, so the width assertion is applied where a card
    // exists and the absence is recorded rather than treated as a pass.
    if (result.cardFound && result.cardMaxWidth !== '512px') {
      failures.push(
        `${route} (a) player card max-width is ${result.cardMaxWidth}, expected 512px`
      );
    }
    if (route === '/reciter/quran.foundation-13' && !result.cardFound) {
      failures.push(`${route} (a) player card did not render`);
    }

    // (b) Exactly five visible controls: previous/next/volume/more at 44px
    // and play at 56px. Sleep, speed and quick actions live in the sheet.
    if (result.transportFound) {
      const controls = result.transportControls ?? [];
      if (controls.length !== 5 || result.transportChildren !== 5) {
        failures.push(
          `${route} (b) transport has ${controls.length} visible controls / ${result.transportChildren} children, expected 5`
        );
      }
      // Locale-independent: the primary control is the single 56px button.
      const play = controls.filter((control) => control.size === 56);
      if (play.length !== 1) {
        failures.push(
          `${route} (b) found ${play.length} 56px play controls, expected 1`
        );
      }
      const ghost = controls.filter((control) => control.size === 44);
      if (ghost.length !== 4) {
        failures.push(
          `${route} (b) expected four 44px ghost controls, found ${ghost.length}`
        );
      }
    }

    // (d) No 210px wrapper may enclose the player content.
    if (result.fixedHeightWrappers.length > 0) {
      failures.push(
        `${route} (d) fixed 210px wrapper(s): ${result.fixedHeightWrappers.join(' | ')}`
      );
    }
  }

  // (c) Scripture face on a real ayah line.
  await page.goto(`${BASE_URL}${SCRIPTURE_ROUTE}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  // The preview fetches a bundled surah before it renders any ayah line.
  await page.waitForSelector('[class*="line"][lang="ar"][dir="rtl"]', {
    timeout: 30000,
  });
  const scripture = await page.evaluate(async () => {
    await document.fonts.ready;
    // `<html>` is also lang=ar dir=rtl, so scope to the CSS-module line class.
    const line = document.querySelector(
      '[class*="line"][lang="ar"][dir="rtl"]'
    );
    if (!line) return { found: false };
    const rect = line.getBoundingClientRect();
    const fontFamily = getComputedStyle(line).fontFamily;
    // check() rejects generic families in the full stack; pass only the first
    // named face, which is the one the scripture line actually asks for.
    const firstFace = fontFamily.split(',')[0]?.trim() || 'serif';
    const unquote = (value) => value.replace(/^["']|["']$/g, '');
    // A system fallback would also make check() true. Require the computed
    // face to be a real FontFace registered by next/font.
    const registeredFamilies = [...document.fonts].map((face) =>
      unquote(face.family)
    );
    // next/font ships several subset faces; check the one that matters with
    // the actual ayah text, otherwise an unloaded Latin subset makes check()
    // false even though the Arabic face is loaded.
    const sampleText = (line.textContent || '').trim().slice(0, 12) || 'قُلْ';
    let available = false;
    try {
      available = document.fonts.check(`28px ${firstFace}`, sampleText);
    } catch {
      available = false;
    }
    return {
      found: true,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      fontFamily,
      firstFace,
      available,
      firstFaceRegistered: registeredFamilies.includes(unquote(firstFace)),
      registeredAmiri: registeredFamilies.filter((family) =>
        /amiri/i.test(family)
      ),
      namesFictionalFace: /Amiri Quran/i.test(fontFamily),
    };
  });
  console.log(`${SCRIPTURE_ROUTE}:`, JSON.stringify(scripture));
  if (!scripture.found || scripture.width <= 0 || scripture.height <= 0) {
    failures.push('(c) ayah line has an empty bounding box');
  }
  if (!scripture.available) {
    failures.push(
      `(c) ayah font family is not available: ${scripture.fontFamily}`
    );
  }
  if (scripture.namesFictionalFace) {
    failures.push(
      '(c) ayah font family still names the fictional "Amiri Quran" face'
    );
  }
  if (!scripture.registeredAmiri || scripture.registeredAmiri.length === 0) {
    failures.push('(c) no Amiri FontFace is registered in document.fonts');
  }
  if (!scripture.firstFaceRegistered) {
    failures.push(
      `(c) ayah's first family ${scripture.firstFace} is not a registered FontFace (only a fallback)`
    );
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

console.log('PASS: player assertions (a)-(d) all satisfied');
