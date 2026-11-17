import { STORAGE_KEYS } from '@/utils/storage/storage-keys';

/**
 * When this device joined the ring, in ms.
 *
 * Stamped once and then repeated unchanged: the device row is rewritten on every
 * heartbeat, and "added" must not drift into "added just now" every five
 * minutes.
 */
let memory: number | null = null;

export function getOrCreateDeviceLinkedAt(): number {
  if (memory !== null) return memory;
  if (typeof window === 'undefined') return Date.now();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.deviceLinkedAt);
    const parsed = raw ? Number(raw) : Number.NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      memory = parsed;
      return parsed;
    }
    memory = Date.now();
    window.localStorage.setItem(STORAGE_KEYS.deviceLinkedAt, String(memory));
    return memory;
  } catch {
    // Private mode: a stamp that lasts the session is better than none.
    memory = Date.now();
    return memory;
  }
}
