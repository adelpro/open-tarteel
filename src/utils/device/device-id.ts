import { STORAGE_KEYS } from '@/utils/storage/storage-keys';

const KEY = STORAGE_KEYS.deviceId;

const randomId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

/** This browser's row id under `devices/<id>`. Never synced, never reused. */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && existing.length > 0) return existing;
    const id = randomId();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    return randomId();
  }
}
