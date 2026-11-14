#!/usr/bin/env node
/**
 * Build public/data/quran from the pinned sources.
 *
 * Output per surah: { surah, ayahs: [{ t, w, b, r }] }
 *   t = verbatim ayah text (never edited)
 *   w = word count, derived by splitting on spaces
 *   b = basmala words stripped from ayah 1 (0 for surah 1 and 9, 4 elsewhere)
 *   r = [[rule, start, end]] codepoint ranges into t, basmala offsets intact
 *
 * The run fails instead of writing anything if a source hash or an invariant
 * does not match. Reproducible: no timestamps, no ordering that depends on the
 * clock, so regenerating must produce identical bytes.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DATA_VERSION, EXPECTED, OUTPUT_DIR, SOURCES } from './sources.mjs';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/* Mirrors src/services/quran-text/words.ts. Data tests assert they agree. */
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

const basmalaWordCount = (text, surah, ayah) => {
  if (ayah !== 1 || surah === 1 || surah === 9) return 0;
  const spans = wordSpans(text);
  if (spans.length < 4) return 0;
  const head = spans
    .slice(0, 4)
    .map(([start, end]) => normalise(text.slice(start, end)));
  return head.every((word, index) => word === BASMALA[index]) ? 4 : 0;
};

const fail = (message) => {
  throw new Error(message);
};

const readSource = async (source) => {
  const buffer = await readFile(source.path);
  const digest = sha256(buffer);
  if (digest !== source.sha256) {
    fail(
      `${source.id}: ${source.path} does not match the pinned hash\n` +
        `  expected ${source.sha256}\n  received ${digest}\n` +
        `  run: npm run data:fetch`
    );
  }
  return buffer;
};

const parseText = (buffer) => {
  const byKey = new Map();
  for (const line of buffer.toString('utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const [surah, ayah, ...rest] = line.split('|');
    const text = rest.join('|');
    if (!/^\d+$/.test(surah) || !/^\d+$/.test(ayah) || !text) continue;
    byKey.set(`${Number(surah)}:${Number(ayah)}`, text);
  }
  return byKey;
};

const parseTajweed = (buffer) => {
  const byKey = new Map();
  for (const record of JSON.parse(buffer.toString('utf8'))) {
    byKey.set(
      `${record.surah}:${record.ayah}`,
      (record.annotations ?? []).map(({ rule, start, end }) => [
        rule,
        start,
        end,
      ])
    );
  }
  return byKey;
};

const main = async () => {
  const [textBuffer, tajweedBuffer] = await Promise.all(
    SOURCES.map((source) => readSource(source))
  );
  const texts = parseText(textBuffer);
  const annotations = parseTajweed(tajweedBuffer);

  if (texts.size !== EXPECTED.ayahs) {
    fail(`expected ${EXPECTED.ayahs} ayahs, parsed ${texts.size}`);
  }
  if (annotations.size !== EXPECTED.ayahs) {
    fail(`expected ${EXPECTED.ayahs} annotation records`);
  }

  const corpus = [];
  const files = [];
  let words = 0;
  let basmalaWords = 0;
  let ayahs = 0;
  let surahsWithBasmala = 0;
  let invalidRanges = 0;

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (let surah = 1; surah <= 114; surah++) {
    const ayahCount = [...texts.keys()].filter((key) =>
      key.startsWith(`${surah}:`)
    ).length;
    const list = [];

    for (let ayah = 1; ayah <= ayahCount; ayah++) {
      const key = `${surah}:${ayah}`;
      const text = texts.get(key);
      if (text == null) fail(`missing text for ${key}`);

      const spans = wordSpans(text);
      const basmala = basmalaWordCount(text, surah, ayah);
      const rules = annotations.get(key) ?? [];

      for (const [, start, end] of rules) {
        if (!(start >= 0 && end > start && end <= text.length)) {
          invalidRanges++;
        }
      }

      words += spans.length;
      basmalaWords += basmala;
      ayahs++;
      if (basmala === 4 && ayah === 1) surahsWithBasmala++;
      corpus.push(text);

      list.push({ t: text, w: spans.length, b: basmala, r: rules });
    }

    const payload = `${JSON.stringify({ surah, ayahs: list })}\n`;
    const path = join(OUTPUT_DIR, `${surah}.json`);
    await writeFile(path, payload);
    files.push({
      surah,
      ayahs: list.length,
      words: list.reduce((total, ayah) => total + ayah.w, 0),
      sha256: sha256(payload),
    });
  }

  const corpusSha256 = sha256(corpus.join('\n'));
  const checks = [
    ['ayahs', ayahs, EXPECTED.ayahs],
    ['words', words, EXPECTED.words],
    ['basmalaWords', basmalaWords, EXPECTED.basmalaWords],
    ['providerWords', words - basmalaWords, EXPECTED.providerWords],
    ['surahsWithBasmala', surahsWithBasmala, EXPECTED.surahsWithBasmala],
    ['invalidRanges', invalidRanges, 0],
    ['corpusSha256', corpusSha256, EXPECTED.corpusSha256],
  ];

  for (const [label, actual, expected] of checks) {
    if (actual !== expected) {
      fail(`${label}: expected ${expected}, got ${actual}`);
    }
  }

  const manifest = {
    schema: 1,
    dataVersion: DATA_VERSION,
    text: {
      name: 'Tanzil Quran Text (Uthmani)',
      version: '1.0.2',
      url: SOURCES[0].url,
      sha256: SOURCES[0].sha256,
      ayahs: EXPECTED.ayahs,
      license: 'CC-BY-3.0 with Tanzil terms',
    },
    tajweed: {
      repo: 'https://github.com/cpfair/quran-tajweed',
      commit: '6689c33bf3d903d1ef75bef62a83750e0a5a7737',
      path: 'output/tajweed.hafs.uthmani-pause-sajdah.json',
      sha256: SOURCES[1].sha256,
      license: 'CC-BY-4.0',
    },
    totals: {
      ayahs,
      words,
      basmalaWords,
      providerWords: words - basmalaWords,
    },
    corpusSha256,
    files,
  };

  await writeFile(
    join(OUTPUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  console.log(
    `built ${ayahs} ayahs, ${words} words (${basmalaWords} basmala), ` +
      `${surahsWithBasmala} surahs with a basmala prefix`
  );
  console.log(`corpus ${corpusSha256}`);
  console.log(`wrote ${files.length} files to ${OUTPUT_DIR}`);
};

main().catch((error) => {
  console.error(`build failed: ${error.message}`);
  process.exit(1);
});
