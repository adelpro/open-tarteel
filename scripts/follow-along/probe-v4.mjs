#!/usr/bin/env node
/**
 * Probe MP3Quran v4 recitations for usable word timings and emit the
 * checked-in follow-along allowlist.
 *
 * Run `node scripts/follow-along/probe-v4.mjs --self-test` for the offline
 * fixture checks before touching the network.
 */

import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = 'https://api-staging.mp3quran.net/v4';
const SAMPLE_SURAHS = [1, 2, 9, 18, 36, 49, 55, 67, 87, 114];
const CONCURRENCY = 4;
const MAX_ATTEMPTS = 5;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 500;
const TIMEOUT_MS = 60_000;
const OUTPUT = join(
  process.cwd(),
  'src/services/reciters/follow-along-v4-ids.generated.ts'
);
const REFERENCE_DIR = join(process.cwd(), 'public/data/quran');

const MIN_COVERAGE = 0.85;
const MP3QURAN_V4_SPLITS = { '2:181': 3, '8:6': 4, '13:37': 8 };

/** Map a provider word number onto our stored index for one ayah. */
function storedFromMp3quranV4(ayahKey, word) {
  const split = MP3QURAN_V4_SPLITS[ayahKey];
  if (!split) return word;
  if (word < split) return word;
  if (word <= split + 1) return split;
  return word - 1;
}

/**
 * Validate one surah's word-timing rows against the local reference counts.
 * Returns distinct valid words / total words; rows that cannot be placed in
 * the reference are dropped rather than counted as missing.
 */
function validateSurah(surah, ayahs, rows) {
  const seen = ayahs.map(() => new Set());
  let total = 0;
  for (const ayah of ayahs) total += ayah.w;

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 4) continue;
    const [ayah, word, start, end] = row;
    if (!Number.isInteger(ayah) || ayah < 1 || ayah > ayahs.length) continue;
    if (!Number.isInteger(word) || word < 1) continue;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      continue;
    }
    const meta = ayahs[ayah - 1];
    const mapped =
      storedFromMp3quranV4(`${surah}:${ayah}`, word) + meta.b;
    if (mapped < 1 || mapped > meta.w) continue;
    seen[ayah - 1].add(mapped);
  }

  let timed = 0;
  for (const words of seen) timed += words.size;
  const coverage = total > 0 ? timed / total : 0;
  return { ok: coverage >= MIN_COVERAGE, coverage, timed, total };
}

/**
 * Judge the whole sample, not each surah: a six-ayah surah loses 17% of its
 * words to one un-timed ayah, which the app's per-ayah fallback handles.
 */
function passesProbe(results) {
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const timed = results.reduce((sum, r) => sum + r.timed, 0);
  return total > 0 && timed / total >= MIN_COVERAGE;
}

/** Offline fixture checks for the validator and the word-number mapping. */
function selfTest() {
  const ayahs = [
    { w: 4, b: 0 },
    { w: 3, b: 0 },
  ];
  const fullRows = [
    [1, 1, 0, 100],
    [1, 2, 100, 200],
    [1, 3, 200, 300],
    [1, 4, 300, 400],
    [2, 1, 400, 500],
    [2, 2, 500, 600],
    [2, 3, 600, 700],
  ];

  const full = validateSurah(1, ayahs, fullRows);
  assert.equal(full.ok, true);
  assert.equal(full.coverage, 1);

  const withBadRows = validateSurah(1, ayahs, [
    ...fullRows,
    [1, 2, 300, 200],
    [1, 99, 0, 100],
    [0, 1, 0, 10],
  ]);
  assert.equal(withBadRows.ok, true);
  assert.equal(withBadRows.coverage, 1);

  const sparse = validateSurah(1, ayahs, [[1, 1, 0, 100]]);
  assert.equal(sparse.ok, false);
  assert.ok(sparse.coverage < 0.85);

  assert.equal(
    passesProbe([
      { coverage: 0.8333, timed: 5, total: 6 },
      { coverage: 1, timed: 760, total: 760 },
    ]),
    true
  );
  assert.equal(
    passesProbe([{ coverage: 0.5, timed: 50, total: 100 }]),
    false
  );

  assert.equal(storedFromMp3quranV4('2:181', 4), 3);

  assert.equal(retryDelayMs('2', 1), 2000);
  assert.equal(retryDelayMs(null, 2), 8000);

  console.log('self-test: PASS');
}

/** Respect the server's Retry-After, falling back to exponential backoff. */
function retryDelayMs(retryAfter, attempt) {
  const seconds = retryAfter === null ? NaN : Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  return 2 ** (attempt + 1) * 1000;
}

const requestTimes = [];

/** Keep the probe under the staging API's 600-per-minute ceiling. */
async function pace() {
  const now = Date.now();
  while (
    requestTimes.length > 0 &&
    now - requestTimes[0] >= RATE_WINDOW_MS
  ) {
    requestTimes.shift();
  }
  if (requestTimes.length >= RATE_LIMIT) {
    const wait = RATE_WINDOW_MS - (now - requestTimes[0]) + 100;
    await new Promise((resolve) => setTimeout(resolve, wait));
    return pace();
  }
  requestTimes.push(Date.now());
}

class RateLimitError extends Error {
  constructor(retryAfter) {
    super('rate limited');
    this.retryAfter = retryAfter;
  }
}

/** Fetch JSON with paced, bounded retries; 404 is a caller-handled miss. */
async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      await pace();
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status === 404) return null;
      if (response.status === 429) {
        throw new RateLimitError(response.headers.get('retry-after'));
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS - 1) {
        const delay = error instanceof RateLimitError
          ? retryDelayMs(error.retryAfter, attempt)
          : retryDelayMs(null, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function loadReference() {
  const reference = new Map();
  for (const surah of SAMPLE_SURAHS) {
    const file = JSON.parse(
      await readFile(join(REFERENCE_DIR, `${surah}.json`), 'utf8')
    );
    reference.set(surah, file.ayahs);
  }
  return reference;
}

async function fetchCatalog() {
  const recitations = [];
  let url = `${BASE}/recitations?locale=en`;
  while (url) {
    const page = await fetchJson(url);
    if (!page || !Array.isArray(page.data)) {
      throw new Error(`Unexpected catalogue page: ${url}`);
    }
    recitations.push(...page.data);
    url = page.links?.next ? new URL(page.links.next, BASE).toString() : null;
  }
  return recitations;
}

async function qualifies(recitation, reference) {
  const results = [];
  for (const surah of SAMPLE_SURAHS) {
    const payload = await fetchJson(
      `${BASE}/recitations/${recitation.id}/surahs/${surah}/word-timings`
    );
    if (!payload || !Array.isArray(payload.data?.words)) return false;
    results.push(
      validateSurah(surah, reference.get(surah), payload.data.words)
    );
  }
  return passesProbe(results);
}

async function emitAllowlist(ids) {
  const sorted = [...ids].sort((a, b) => Number(a) - Number(b));
  const date = new Date().toISOString().slice(0, 10);
  const body = `/**
 * Generated by scripts/follow-along/probe-v4.mjs on ${date}.
 * ${sorted.length} MP3Quran v4 recitations passed the sampled word-timing probe.
 * Do not edit by hand; re-run the probe after the staging catalogue changes.
 */
export const FOLLOW_ALONG_V4_RECITER_IDS: ReadonlySet<string> = new Set([
${sorted.map((id) => `  '${id}',`).join('\n')}
]);
`;
  await writeFile(OUTPUT, body);
  console.log(`wrote ${sorted.length} IDs to ${OUTPUT}`);
}

async function main() {
  const reference = await loadReference();
  const catalog = await fetchCatalog();
  const hafs = catalog.filter(
    (item) => item.riwayahs?.[0]?.code === 'hafs_an_asim'
  );
  console.log(`probing ${hafs.length} Hafs recitations`);

  const passing = new Set();
  let cursor = 0;
  const worker = async () => {
    while (cursor < hafs.length) {
      const recitation = hafs[cursor++];
      if (await qualifies(recitation, reference)) {
        passing.add(String(recitation.id));
      }
    }
  };
  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker())
  );
  await emitAllowlist(passing);
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  await main();
}
