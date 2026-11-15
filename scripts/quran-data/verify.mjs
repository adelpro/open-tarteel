#!/usr/bin/env node
/**
 * Verify the committed output against its manifest, without network access.
 *
 * Checks: per-file digests, totals, basmala counts, annotation bounds, corpus
 * digest, and the special ayat the alignment depends on. Exits non-zero on any
 * mismatch, so it can gate CI.
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { EXPECTED, OUTPUT_DIR } from './sources.mjs';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const wordSpans = (text) => {
  const spans = [];
  let start = -1;
  for (let index = 0; index <= text.length; index++) {
    const isSpace = index === text.length || text[index] === ' ';
    if (!isSpace && start === -1) start = index;
    else if (isSpace && start !== -1) {
      spans.push([start, index]);
      start = -1;
    }
  }
  return spans;
};

const normalise = (value) =>
  value
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\u0621-\u064A]/g, '');

const BASMALA = ['بسم', 'الله', 'الرحمن', 'الرحيم'];

const failures = [];
const check = (label, actual, expected) => {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
};

const manifest = JSON.parse(
  await readFile(join(OUTPUT_DIR, 'manifest.json'), 'utf8')
);

let ayahs = 0;
let words = 0;
let basmalaWords = 0;
let surahsWithBasmala = 0;
let invalidRanges = 0;
const corpus = [];
const special = new Map([
  ['1:1', { w: 4, b: 0 }],
  ['9:1', { w: 9, b: 0 }],
  ['112:1', { w: 8, b: 4 }],
  ['2:181', { w: 13, b: 0 }],
  ['8:6', { w: 11, b: 0 }],
  ['13:37', { w: 19, b: 0 }],
  ['37:130', { w: 4, b: 0 }],
]);
const seenSpecial = new Set();

for (const file of manifest.files) {
  const path = join(OUTPUT_DIR, `${file.surah}.json`);
  const payload = await readFile(path);
  check(`file ${file.surah} digest`, sha256(payload), file.sha256);

  const data = JSON.parse(payload.toString('utf8'));
  check(`file ${file.surah} surah`, data.surah, file.surah);
  check(`file ${file.surah} ayah count`, data.ayahs.length, file.ayahs);

  for (const [index, ayah] of data.ayahs.entries()) {
    const ayahNumber = index + 1;
    ayahs++;
    words += ayah.w;
    basmalaWords += ayah.b;

    const spans = wordSpans(ayah.t);
    if (spans.length !== ayah.w) {
      failures.push(
        `${file.surah}:${ayahNumber}: stored w=${ayah.w}, split=${spans.length}`
      );
    }

    const expectedBasmala =
      ayahNumber === 1 && file.surah !== 1 && file.surah !== 9
        ? spans
            .slice(0, 4)
            .map(([start, end]) => normalise(ayah.t.slice(start, end)))
            .every((word, index) => word === BASMALA[index])
          ? 4
          : 0
        : 0;
    if (expectedBasmala !== ayah.b) {
      failures.push(
        `${file.surah}:${ayahNumber}: stored b=${ayah.b}, detected=${expectedBasmala}`
      );
    }
    if (ayah.b === 4 && ayahNumber === 1) surahsWithBasmala++;

    for (const [, start, end] of ayah.r) {
      if (!(start >= 0 && end > start && end <= ayah.t.length)) {
        invalidRanges++;
      }
    }

    const key = `${file.surah}:${ayahNumber}`;
    if (special.has(key)) {
      seenSpecial.add(key);
      const want = special.get(key);
      if (ayah.w !== want.w || ayah.b !== want.b) {
        failures.push(
          `${key}: expected w=${want.w} b=${want.b}, got w=${ayah.w} b=${ayah.b}`
        );
      }
    }

    corpus.push(ayah.t);
  }
}

check('total ayahs', ayahs, EXPECTED.ayahs);
check('total words', words, EXPECTED.words);
check('basmala words', basmalaWords, EXPECTED.basmalaWords);
check('provider words', words - basmalaWords, EXPECTED.providerWords);
check('surahs with basmala', surahsWithBasmala, EXPECTED.surahsWithBasmala);
check('corpus digest', sha256(corpus.join('\n')), EXPECTED.corpusSha256);
check('invalid ranges', invalidRanges, 0);
check('special ayat seen', seenSpecial.size, special.size);
check('manifest ayahs', manifest.totals.ayahs, ayahs);
check('manifest words', manifest.totals.words, words);

if (failures.length > 0) {
  console.error(`verify failed with ${failures.length} problem(s):`);
  for (const failure of failures.slice(0, 20)) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `ok: ${ayahs} ayahs, ${words} words, ${basmalaWords} basmala, ` +
    `${surahsWithBasmala} surahs with a prefix, ${manifest.files.length} files`
);
