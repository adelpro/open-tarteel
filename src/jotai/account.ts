import { atom } from 'jotai';

import type { RemoteSettings } from '@/utils/settings-sync';

/**
 * The ring's state, as the auth bridge and `useUserSync` publish it.
 *
 * Plain atoms, not `atomWithStorage`: the keypair is the only thing persisted
 * (by `gun/account-store`), and everything here is rebuilt from it at boot.
 */
export const gunLoggedInAtom = atom<boolean>(false);
gunLoggedInAtom.debugLabel = 'gun-logged-in';

export const gunUserPubAtom = atom<string | null>(null);
gunUserPubAtom.debugLabel = 'gun-user-pub';

export const gunUserAliasAtom = atom<string | null>(null);
gunUserAliasAtom.debugLabel = 'gun-user-alias';

export const gunLoadingAtom = atom<boolean>(false);
gunLoadingAtom.debugLabel = 'gun-loading';

export const gunErrorAtom = atom<string | null>(null);
gunErrorAtom.debugLabel = 'gun-error';

export type DeviceRow = {
  id: string;
  name?: string;
  pub?: string;
  lastSeen?: number;
  linkedAt?: number;
  userAgent?: string;
};

export type DevicesMeta = {
  primaryPub?: string;
  primaryDeviceId?: string;
  createdAt?: number;
};

export const userDevicesAtom = atom<Record<string, DeviceRow>>({});
userDevicesAtom.debugLabel = 'user-devices';

export const userDevicesMetaAtom = atom<DevicesMeta>({});
userDevicesMetaAtom.debugLabel = 'user-devices-meta';

/** The account's settings node, last-write-wins on `updatedAt`. */
export const userSettingsAtom = atom<RemoteSettings>({});
userSettingsAtom.debugLabel = 'user-settings';
