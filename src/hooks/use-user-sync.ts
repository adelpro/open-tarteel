'use client';
import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { user } from '@/gun';
import { once } from '@/gun/once';
import {
  type DeviceRow,
  type DevicesMeta,
  gunUserPubAtom,
  userDevicesAtom,
  userDevicesMetaAtom,
  userSettingsAtom,
} from '@/jotai/account';
import { favoriteRecitersAtom } from '@/jotai/atom';
import { getOrCreateDeviceId } from '@/utils/device/device-id';
import { getOrCreateDeviceLinkedAt } from '@/utils/device/device-linked-at';
import { getOrCreateDeviceName } from '@/utils/device/device-name';
import { mergeFavorites, readLocalFavorites } from '@/utils/favorites-sync';
import type { RemoteSettings } from '@/utils/settings-sync';

/** `lastSeen` is a hint, not a presence signal: five minutes is plenty. */
const HEARTBEAT_MS = 5 * 60_000;

const stamp = (value: { updatedAt?: unknown }) =>
  typeof value.updatedAt === 'number' ? value.updatedAt : 0;

/** Settings are last-write-wins on `updatedAt`, never a blind merge. */
function newerSettings(
  previous: RemoteSettings,
  incoming: RemoteSettings
): RemoteSettings {
  return stamp(incoming) >= stamp(previous)
    ? { ...previous, ...incoming }
    : previous;
}

/** `_` is Gun's metadata on the node, not a setting. */
function withoutMetadata(value: Record<string, unknown>): RemoteSettings {
  const settings = { ...value };
  delete settings._;
  return settings as RemoteSettings;
}

/**
 * The first device to register claims "primary". Never overwritten, so a later
 * device cannot take the badge.
 */
function claimPrimary(deviceId: string): void {
  const metaNode = user.get('devices').get('meta');
  metaNode.once((meta: DevicesMeta | undefined) => {
    if (meta?.primaryDeviceId) return;
    if (meta?.primaryPub) {
      // An older row recorded only the pub: find the device that holds it.
      user.get('devices').once((all: Record<string, DeviceRow> | undefined) => {
        if (!all) return;
        let foundId: string | null = null;
        for (const [id, row] of Object.entries(all)) {
          if (id === '_' || id === 'meta' || row?.pub !== meta.primaryPub) {
            continue;
          }
          const best = foundId ? (all[foundId]?.lastSeen ?? 0) : -1;
          if ((row?.lastSeen ?? 0) > best) foundId = id;
        }
        // A partial put: Gun merges it into the node field by field.
        metaNode.put({ primaryDeviceId: foundId ?? deviceId });
      });
      return;
    }
    metaNode.put({
      primaryDeviceId: deviceId,
      primaryPub: user.is?.pub,
      createdAt: Date.now(),
    });
  });
}

/**
 * Writes this device's row so every linked device can see it in the list.
 *
 * The row is also put into the atom straight away: waiting for the relay echo
 * left a freshly created ring showing "0 devices" and "No devices recorded yet"
 * for as long as the round trip took — or forever, if the echo never came.
 */
export function touchDevice(name?: string): void {
  if (!user?.is) return;
  const deviceId = getOrCreateDeviceId();
  const row: DeviceRow = {
    id: deviceId,
    name: name || getOrCreateDeviceName(),
    pub: user.is.pub,
    lastSeen: Date.now(),
    // Written on every touch but never recomputed: the row is rewritten on the
    // heartbeat, and the join date has to stay the join date.
    linkedAt: getOrCreateDeviceLinkedAt(),
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  };
  getDefaultStore().set(userDevicesAtom, (previous) => ({
    ...previous,
    [deviceId]: row,
  }));

  try {
    user.get('devices').get(deviceId).put(row);
    claimPrimary(deviceId);
  } catch {
    // offline or relay down: the next touch retries
  }
}

/**
 * One write, no read-modify-write.
 *
 * The caller hands over the whole stamped object, so two devices changing
 * different fields in the same second each send a complete picture. It also
 * avoids a `.once()` gate: on a node the relay has never seen, that callback
 * could simply never fire, which is how the first settings write of a fresh
 * account went missing in Tilawa.
 */
export function updateSettings(settings: RemoteSettings): void {
  if (!user?.is) return;
  try {
    user.get('settings').put({
      ...settings,
      updatedAt:
        typeof settings.updatedAt === 'number'
          ? settings.updatedAt
          : Date.now(),
    });
  } catch {
    // offline: the local state already holds it
  }
}

/**
 * A plain function, not part of the hook: Tilawa's device list called
 * `useUserSync()` a second time just to reach this, which opened a second set
 * of relay subscriptions for as long as the list was on screen.
 */
export function updateDeviceName(deviceId: string, name: string): void {
  if (!user?.is) return;
  const next = name.trim() || 'Device';
  getDefaultStore().set(userDevicesAtom, (previous) =>
    previous[deviceId]
      ? { ...previous, [deviceId]: { ...previous[deviceId], name: next } }
      : previous
  );
  user.get('devices').get(deviceId).put({ name: next, lastSeen: Date.now() });
}

/**
 * Mirrors the account graph into atoms. Mount once (`AccountSync`), never per
 * component: every `.map().on()` here is a live relay subscription.
 */
export function useUserSync(): void {
  const pub = useAtomValue(gunUserPubAtom);
  // Subscribed, not only set: the subscription is what mounts the storage atom
  // and loads the stored list. A set on an unmounted `atomWithStorage` starts
  // from its `[]` default and would overwrite the stored favourites.
  const [, setFavorites] = useAtom(favoriteRecitersAtom);
  const setDevices = useSetAtom(userDevicesAtom);
  const setDevicesMeta = useSetAtom(userDevicesMetaAtom);
  const setSettings = useSetAtom(userSettingsAtom);

  useEffect(() => {
    if (!pub || !user?.is) {
      // Signed out: forget the ring's rows and settings. Left in place, a ring
      // created next on this browser would count the old ring's devices — the
      // last-device sign-out guard would see "2 devices" and stand down — and
      // the old settings stamp would outrank the new ring's settings.
      setDevices({});
      setDevicesMeta({});
      setSettings({});
      return;
    }

    let cancelled = false;
    const nodes: any[] = [];

    const watch = (node: any, listener: (value: any, key: string) => void) => {
      nodes.push(node);
      node.on(listener);
    };

    // Snapshot first: a `.on()` alone replays late, and the UI would flash empty.
    void (async () => {
      const remote = await once(user.get('favorites'));
      if (cancelled) return;

      // The atom is written directly, never through `toggleFavorite`: that
      // would move the public favourite counter for a favourite this person
      // already counted on the device where they made it.
      const { merged, missing } = mergeFavorites(readLocalFavorites(), remote);
      setFavorites(merged);
      for (const id of missing) user.get('favorites').get(id).put(true);

      const [devices, meta, remoteSettings] = await Promise.all([
        once<Record<string, DeviceRow>>(user.get('devices')),
        once<DevicesMeta>(user.get('devices').get('meta')),
        once<Record<string, unknown>>(user.get('settings')),
      ]);
      if (cancelled) return;

      // Merge, never replace: the snapshot can resolve after this device has
      // already written its own row, and a replace would erase it.
      if (devices && typeof devices === 'object') {
        setDevices((previous) => ({ ...devices, ...previous }));
      }
      if (meta && typeof meta === 'object') {
        setDevicesMeta((previous) => ({ ...meta, ...previous }));
      }
      if (remoteSettings && typeof remoteSettings === 'object') {
        const incoming = withoutMetadata(remoteSettings);
        setSettings((previous) => newerSettings(previous, incoming));
      }
    })();

    watch(user.get('favorites').map(), (value: unknown, key: string) => {
      if (key === '_') return;
      setFavorites((previous) => {
        const has = previous.includes(key);
        if (value === true && !has) return [...previous, key];
        if (value !== true && has) return previous.filter((id) => id !== key);
        return previous;
      });
    });

    watch(user.get('devices').map(), (value: unknown, key: string) => {
      if (
        key === '_' ||
        key === 'meta' ||
        !value ||
        typeof value !== 'object'
      ) {
        return;
      }
      setDevices((previous) => ({ ...previous, [key]: value as DeviceRow }));
    });

    watch(user.get('devices').get('meta'), (value: unknown) => {
      if (value && typeof value === 'object') {
        setDevicesMeta(value as DevicesMeta);
      }
    });

    // A setting changed on another device lands without a reload.
    watch(user.get('settings'), (value: unknown) => {
      if (!value || typeof value !== 'object') return;
      const incoming = withoutMetadata(value as Record<string, unknown>);
      setSettings((previous) => newerSettings(previous, incoming));
    });

    touchDevice();
    // Only while the tab is visible: a background tab writing forever is relay
    // storage nobody reads.
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') touchDevice();
    }, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      for (const node of nodes) {
        try {
          node.off();
        } catch {
          // already gone
        }
      }
    };
  }, [pub, setFavorites, setDevices, setDevicesMeta, setSettings]);
}
