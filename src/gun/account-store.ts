'use client';
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';

const KEY = STORAGE_KEYS.account;

/**
 * The account keypair, kept in this browser.
 *
 * Gun's `recall()` only ever writes to sessionStorage, so without this the
 * account died with the tab and the listener had to scan a pairing code again
 * every time they reopened the browser — the opposite of "the account lives on
 * this device". Anyone with access to this browser profile can read the key,
 * exactly as they could read a signed-in session cookie; signing out erases it.
 *
 * localStorage is used directly, with try/catch, rather than through
 * `createStorage`: that adapter does not catch, and a private-mode quota error
 * on this key must not take the auth bridge down with it.
 */
export type StoredPair = {
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
};

function isPair(value: unknown): value is StoredPair {
  const pair = value as Partial<StoredPair> | null;
  return Boolean(pair?.pub && pair.priv && pair.epub && pair.epriv);
}

export function readStoredPair(): StoredPair | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPair(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storePair(pair: unknown): void {
  if (typeof window === 'undefined' || !isPair(pair)) return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        pub: pair.pub,
        priv: pair.priv,
        epub: pair.epub,
        epriv: pair.epriv,
      })
    );
  } catch {
    // private mode: the account lasts for this session only
  }
}

export function clearStoredPair(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to do
  }
}
