'use client';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect } from 'react';

import { SEA, user } from '@/gun';
import { clearStoredPair, storePair } from '@/gun/account-store';
import {
  authPair,
  publishAuthState,
  setRingName,
  startAuthBridge,
} from '@/gun/auth';
import {
  gunErrorAtom,
  gunLoadingAtom,
  gunLoggedInAtom,
  gunUserAliasAtom,
  gunUserPubAtom,
} from '@/jotai/account';
import { getOrCreateDeviceName } from '@/utils/device/device-name';

/**
 * Auth surface. The subscription that keeps the atoms honest lives in
 * `gun/auth.ts` — registering one per component meant removing all of them,
 * including Gun's own, on unmount.
 */
export function useGun() {
  const loggedIn = useAtomValue(gunLoggedInAtom);
  const pub = useAtomValue(gunUserPubAtom);
  const name = useAtomValue(gunUserAliasAtom);
  const [loading, setLoading] = useAtom(gunLoadingAtom);
  const [error, setError] = useAtom(gunErrorAtom);

  useEffect(() => {
    startAuthBridge();
  }, []);

  const run = useCallback(
    async (
      action: () => Promise<{ err?: string }>
    ): Promise<{ err?: string }> => {
      setLoading(true);
      setError(null);
      try {
        const ack = await action();
        if (ack?.err) setError(ack.err);
        publishAuthState();
        return ack;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  /**
   * An account is a keypair generated here. No username, no password: the key
   * is the identity, and it is the only thing that can open the account. Other
   * devices get it by scanning a pairing code.
   */
  const createAccount = useCallback(
    (ringName?: string) =>
      run(async () => {
        const pair = await SEA.pair();
        const ack = await authPair(pair);
        if (!ack.err) {
          storePair(pair);
          const name = (ringName || '').trim() || getOrCreateDeviceName();
          user.get('profile').put({
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          // The relay may take a round trip to echo it back; we already know it.
          setRingName(name);
        }
        return ack;
      }),
    [run]
  );

  const authWithPair = useCallback(
    (pair: unknown) =>
      run(async () => {
        const ack = await authPair(pair);
        if (!ack.err) storePair(pair);
        return ack;
      }),
    [run]
  );

  const renameAccount = useCallback((next: string) => {
    const trimmed = next.trim();
    if (!trimmed) return;
    user.get('profile').put({ name: trimmed, updatedAt: Date.now() });
    setRingName(trimmed);
  }, []);

  const logout = useCallback(() => {
    clearStoredPair();
    try {
      user.leave();
    } catch {
      // ignore
    }
    // leave() clears `user.is` but emits no auth event, so say so explicitly.
    publishAuthState();
    setError(null);
  }, [setError]);

  /** The SEA pair, read straight off the live user chain. */
  const getPair = useCallback(() => {
    try {
      return (user as unknown as { _: { sea?: unknown } })._.sea || null;
    } catch {
      return null;
    }
  }, []);

  return {
    loggedIn,
    pub,
    name,
    loading,
    error,
    createAccount,
    authWithPair,
    renameAccount,
    logout,
    getPair,
  };
}
