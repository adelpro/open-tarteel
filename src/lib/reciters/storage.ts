import { del, get, set } from 'idb-keyval';

import type { CacheOptions, ReciterCacheEntry } from '@/types';

import { DEFAULT_CACHE_OPTION } from '../utils';

const CACHE_KEY = 'reciters_cache';

/** Default TTL: 60 minutes */
export const DEFAULT_TTL_MS = 60 * 60 * 1000;

// ── Read ──────────────────────────────────────────────────────────────────────

export async function readCache(): Promise<ReciterCacheEntry | null> {
  try {
    const envelope = await get<ReciterCacheEntry>(CACHE_KEY);
    return envelope ?? null;
  } catch {
    return null;
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function writeCache(envelope: ReciterCacheEntry): Promise<void> {
  try {
    await set(CACHE_KEY, envelope);
  } catch {
    // IDB write failed — non-fatal, in-memory state still works
  }
}

// ── Clear ─────────────────────────────────────────────────────────────────────

export async function clearCache(): Promise<void> {
  try {
    await del(CACHE_KEY);
  } catch {
    // non-fatal
  }
}

// ── TTL helpers ───────────────────────────────────────────────────────────────

export function isExpired(envelope: ReciterCacheEntry): boolean {
  return Date.now() > envelope.options.ttl;
}

export function makeTtl(durationMs = DEFAULT_TTL_MS): number {
  return Date.now() + durationMs;
}
/**
 * Build a fresh envelope with the given data and options.
 * Merges with existing options so partial overrides work.
 */
export function buildEnvelope(
  data: ReciterCacheEntry['data'],
  options: Partial<CacheOptions>,
  existingOptions?: CacheOptions
): ReciterCacheEntry {
  return {
    data,
    cachedAt: Date.now(),
    options: {
      ...DEFAULT_CACHE_OPTION,
      ...existingOptions, // preserve any previously saved preferences
      ...options, // caller overrides win
      ttl: makeTtl(), // always reset TTL on fresh write
    },
  };
}
