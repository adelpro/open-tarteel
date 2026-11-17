'use client';

import { getDefaultStore, useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { useGun } from '@/hooks/use-gun';
import { updateSettings, useUserSync } from '@/hooks/use-user-sync';
import { gunLoggedInAtom, userSettingsAtom } from '@/jotai/account';
import {
  enabledSourcesStoredAtom,
  paletteStoredAtom,
  playbackSpeedStoredAtom,
  recitersSortStoredAtom,
  themeStoredAtom,
  visualizerModelStoredAtom,
} from '@/jotai/atom';
import {
  readSettingsStamp,
  resolveRemoteSettings,
  shouldPushLocalSettings,
  type SyncedSettings,
  toRemoteSettings,
  writeSettingsStamp,
} from '@/utils/settings-sync';
import { SETTINGS_EVENT } from '@/utils/storage/storage-keys';

const store = getDefaultStore();

/**
 * This device's synced settings, read from the store at the moment of the push.
 *
 * Read from the store, not from render state: `markSettingsChanged` fires inside
 * the atom's setter, before React has re-rendered with the new value.
 */
function localSettings(): SyncedSettings {
  return {
    theme: store.get(themeStoredAtom),
    palette: store.get(paletteStoredAtom),
    sources: store.get(enabledSourcesStoredAtom),
    sort: store.get(recitersSortStoredAtom),
    visualizer: store.get(visualizerModelStoredAtom),
    speed: store.get(playbackSpeedStoredAtom),
  };
}

function pushLocalSettings(): void {
  updateSettings(toRemoteSettings(localSettings(), readSettingsStamp()));
}

/**
 * The ring's background work, mounted once in the root shell: Tilawa's `App`.
 *
 * `useGun` starts the auth bridge (and signs back in from the stored keypair),
 * `useUserSync` holds the account's relay subscriptions and the heartbeat, and
 * the two effects below are Tilawa's `App.tsx` settings effects. Mounting any of
 * this a second time would open a second set of subscriptions, so nothing else
 * does.
 *
 * Inbound settings are written to the `*StoredAtom`s and the remote stamp is
 * copied locally, without `SETTINGS_EVENT` — so receiving a value can never
 * bounce it back to the relay.
 */
export default function AccountSync() {
  useGun();
  useUserSync();

  const loggedIn = useAtomValue(gunLoggedInAtom);
  const remote = useAtomValue(userSettingsAtom);

  // Subscribed so the storage atoms are mounted, and `store.get` above returns
  // the stored value rather than the `atomWithStorage` default.
  useAtomValue(themeStoredAtom);
  useAtomValue(paletteStoredAtom);
  useAtomValue(enabledSourcesStoredAtom);
  useAtomValue(recitersSortStoredAtom);
  useAtomValue(visualizerModelStoredAtom);
  useAtomValue(playbackSpeedStoredAtom);

  useEffect(() => {
    if (!loggedIn) return;
    const local = { updatedAt: readSettingsStamp() };
    const applied = resolveRemoteSettings(local, remote);

    if (applied) {
      if (applied.theme) store.set(themeStoredAtom, applied.theme);
      if (applied.palette) store.set(paletteStoredAtom, applied.palette);
      if (applied.sources) store.set(enabledSourcesStoredAtom, applied.sources);
      if (applied.sort) store.set(recitersSortStoredAtom, applied.sort);
      if (applied.visualizer) {
        store.set(visualizerModelStoredAtom, applied.visualizer);
      }
      if (applied.speed !== undefined) {
        store.set(playbackSpeedStoredAtom, applied.speed);
      }
      // The echo of this stamp is now "not newer", so it is not applied twice.
      writeSettingsStamp(applied.updatedAt);
      return;
    }

    // The account is older (or silent) and this device has a newer choice —
    // send it up once, so a second device can adopt it.
    if (shouldPushLocalSettings(local, remote)) pushLocalSettings();
  }, [loggedIn, remote]);

  useEffect(() => {
    window.addEventListener(SETTINGS_EVENT, pushLocalSettings);
    return () => window.removeEventListener(SETTINGS_EVENT, pushLocalSettings);
  }, []);

  return null;
}
