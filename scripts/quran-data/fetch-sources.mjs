#!/usr/bin/env node
/**
 * Download the pinned sources into data/sources and verify their digests.
 * Existing files that already match are left alone, so this is cheap to rerun.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { SOURCES } from './sources.mjs';

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const readIfPresent = async (path) => {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
};

const download = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

for (const source of SOURCES) {
  const existing = await readIfPresent(source.path);
  if (existing && sha256(existing) === source.sha256) {
    console.log(`ok       ${source.id}: cached and verified`);
    continue;
  }

  console.log(`fetching ${source.id}: ${source.url}`);
  const body = await download(source.url);
  const digest = sha256(body);
  if (digest !== source.sha256) {
    throw new Error(
      `${source.id}: hash mismatch\n  expected ${source.sha256}\n  received ${digest}`
    );
  }
  await mkdir(dirname(source.path), { recursive: true });
  await writeFile(source.path, body);
  console.log(`ok       ${source.id}: ${body.length} bytes, ${digest}`);
}
