'use client';
import { getDefaultStore } from 'jotai';

import { touchDevice } from '@/hooks/use-user-sync';
import {
  gunLoggedInAtom,
  gunUserAliasAtom,
  gunUserPubAtom,
} from '@/jotai/account';

import { clearStoredPair, readStoredPair } from './account-store';
import { ensureUserSchema } from './ensure-user-schema';
import { gun, type GunAck, user } from './index';

const store = getDefaultStore();

let started = false;
/** The account pub whose `profile.name` is already being watched. */
let listenedPub: string | null = null;

export function authPair(pair: unknown): Promise<GunAck> {
  return new Promise((resolve) => {
    try {
      (gun.user() as any).auth(pair, (ack: GunAck) => resolve(ack || {}));
    } catch (error) {
      resolve({ err: error instanceof Error ? error.message : 'auth failed' });
    }
  });
}

/**
 * The ring's name lives in `profile.name`, not in the keypair, so every device
 * reads it back from the account.
 *
 * A one-shot read is the wrong tool here. It used to be issued while a fresh
 * ring's profile was still empty — and `.once()` on a path the relay has not
 * answered may never call back at all — so the sheet was left holding whatever
 * placeholder had been written first. A subscription is registered per account
 * pub instead: it fires when the local write lands, when the relay echoes the
 * profile to another device, and when the name is edited in the sheet.
 */
function watchRingName(pub: string): void {
  if (listenedPub === pub) return;
  listenedPub = pub;
  // A different account: the old name must not survive the switch.
  store.set(gunUserAliasAtom, null);
  // `on` is attached to this account's own chain, not the root, so it needs no
  // removal — and `gun.off()` is never an option: it would strip the relay's
  // listeners too.
  user
    .get('profile')
    .get('name')
    .on((stored: unknown) => {
      if (typeof stored === 'string' && stored.trim()) {
        store.set(gunUserAliasAtom, stored.trim());
      }
    });
}

/** Optimistic write of a name we already know (create and rename). */
export function setRingName(name: string | null): void {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  store.set(gunUserAliasAtom, trimmed || null);
}

/**
 * Mirrors Gun's auth state into atoms.
 *
 * Until the account's name arrives the atom stays null: the panel shows a
 * loading mark rather than pretending the device name is the ring's name.
 */
function publish(): void {
  if (!user?.is) {
    store.set(gunLoggedInAtom, false);
    store.set(gunUserPubAtom, null);
    store.set(gunUserAliasAtom, null);
    // Signing back into the same ring must re-read it, not wait for an edit.
    listenedPub = null;
    return;
  }

  const pub = user.is.pub || null;
  store.set(gunLoggedInAtom, true);
  store.set(gunUserPubAtom, pub);

  if (!pub) {
    store.set(gunUserAliasAtom, null);
    return;
  }
  watchRingName(pub);
}

/**
 * One auth subscription for the whole app.
 *
 * `gun.off()` takes no argument and removes *every* listener on the chain —
 * including the network's own — so a per-component subscription that cleaned up
 * after itself would have disconnected the relay. This is registered once and
 * never removed.
 */
export function startAuthBridge(): void {
  if (started || !user) return;
  started = true;

  gun.on('auth', () => {
    publish();
    if (user.is) void ensureUserSchema().then(() => touchDevice());
  });

  publish();

  // Gun's recall() only writes to sessionStorage, so a stored keypair is the
  // only thing that survives closing the browser.
  if (!user.is) {
    const stored = readStoredPair();
    if (stored) {
      void authPair(stored).then((ack) => {
        if (ack.err) clearStoredPair();
        publish();
      });
    }
  }
}

/** Called after leave(), which clears `user.is` but emits no auth event. */
export function publishAuthState(): void {
  publish();
}
