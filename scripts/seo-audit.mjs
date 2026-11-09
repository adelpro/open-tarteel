#!/usr/bin/env node
/**
 * Audit the deployed sitemap and the pages it lists.
 *
 *   CHECK_URL=https://tarteel.quran.us.kg node scripts/seo-audit.mjs
 *   CHECK_URL=http://127.0.0.1:3101 node scripts/seo-audit.mjs
 *
 * This catches the failures Search Console reports days later: a listed page
 * that is noindex, a canonical pointing somewhere else, or a language twin
 * that is not reciprocal.
 */
const SITE = (process.env.CHECK_URL ?? 'http://127.0.0.1:3100').replace(
  /\/+$/,
  ''
);
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(SITE);
const failures = [];
const notes = [];

const check = (label, ok, detail = '') => {
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`
  );
  if (!ok) failures.push(`${label}${detail ? `: ${detail}` : ''}`);
};

const get = async (url) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'open-tarteel-seo-audit/1.0' },
  });
  return { response, text: await response.text() };
};

const locsOf = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

const alternatesOf = (xml) =>
  [
    ...xml.matchAll(/<xhtml:link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g),
  ].map((match) => [match[1], match[2]]);

const samePage = (canonical, loc) => {
  if (canonical === loc) return true;
  if (!isLocal) return false;
  try {
    return new URL(canonical).pathname === new URL(loc).pathname;
  } catch {
    return false;
  }
};

const main = async () => {
  const { response, text: xml } = await get(`${SITE}/sitemap.xml`);
  check(
    'sitemap answers 200',
    response.status === 200,
    String(response.status)
  );
  check(
    'sitemap is XML',
    (response.headers.get('content-type') ?? '').includes('xml')
  );
  check('sitemap declares xhtml', xml.includes('xmlns:xhtml='));

  const locs = locsOf(xml);
  const alternates = alternatesOf(xml);
  check('sitemap lists URLs', locs.length > 0, String(locs.length));
  check('no duplicate loc', locs.length === new Set(locs).size);
  check(
    'every loc is absolute',
    locs.every((loc) => /^https?:\/\//.test(loc))
  );
  const paired = locs.filter((loc) => !/\/reciter\//.test(loc));
  check(
    'every paired URL has four language twins',
    alternates.length === paired.length * 4,
    `${alternates.length} alternates for ${paired.length} paired URLs`
  );
  check(
    'no private route is listed',
    !locs.some((loc) => /\/(settings|offline|design-preview)(\/|$)/.test(loc))
  );

  const sample = [
    ...new Set([
      `${SITE}/`,
      `${SITE}/en`,
      `${SITE}/de`,
      `${SITE}/about`,
      `${SITE}/en/about`,
      `${SITE}/contact`,
      `${SITE}/privacy`,
      ...locs
        .filter(
          (loc) =>
            loc.includes('/reciter/') && !/\/(en|de)\/reciter\//.test(loc)
        )
        .slice(0, 2),
    ]),
  ];

  for (const loc of sample) {
    const target = isLocal ? loc.replace(/^https?:\/\/[^/]+/, SITE) : loc;
    const { response: pageResponse, text: html } = await get(target);
    check(
      `${loc} answers 200`,
      pageResponse.status === 200,
      String(pageResponse.status)
    );

    const robots = pageResponse.headers.get('x-robots-tag') ?? '';
    const metaRobots =
      html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
    check(
      `${loc} is not noindex`,
      !/noindex/i.test(robots) && !/noindex/i.test(metaRobots)
    );

    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    check(`${loc} has a canonical`, Boolean(canonical));
    if (canonical)
      check(
        `${loc} canonical points at itself`,
        samePage(canonical, loc),
        canonical
      );

    const pageAlternates = [
      ...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g),
    ].map((match) => match[1]);
    if (pageAlternates.length > 0) {
      check(
        `${loc} declares ar, en, de and x-default`,
        ['ar', 'en', 'de', 'x-default'].every((lang) =>
          pageAlternates.includes(lang)
        ),
        pageAlternates.join(', ')
      );
      const pageAlternateHrefs = [
        ...html.matchAll(
          /<link rel="alternate" hreflang="[^"]+" href="([^"]+)"/g
        ),
      ].map((match) => match[1]);
      check(
        `${loc} hreflang targets are in the sitemap`,
        pageAlternateHrefs.every(
          (href) =>
            locs.includes(href) ||
            (isLocal && locs.some((item) => samePage(item, href)))
        )
      );
    } else {
      notes.push(`${loc} has no hreflang links`);
    }
  }

  const { text: robots } = await get(`${SITE}/robots.txt`);
  check('robots.txt names the sitemap', robots.includes('Sitemap:'));
  check(
    'robots.txt has no blanket disallow',
    !/^\s*Disallow:\s*\/\s*$/m.test(robots)
  );
};

try {
  await main();
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

console.log();
if (failures.length > 0) {
  console.log(`${failures.length} problem(s):`);
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'seo audit: compatible with the protocol and Search Console checks'
);
if (notes.length > 0) console.log(`(${notes.length} note(s), not errors)`);
