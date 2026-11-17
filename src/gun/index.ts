'use client';
import Gun from 'gun/gun';

import { GUNCONFIG } from '@/constants';

const isBrowser = typeof window !== 'undefined';

// SEA reads window.crypto when it loads. On the server it would try to require
// Node modules by a computed name, which the Next bundle cannot resolve.
if (isBrowser) require('gun/sea');

export const gun = Gun(GUNCONFIG);

const recallUser = () => gun.user().recall({ sessionStorage: true });
/** Undefined on the server; every use is inside an effect or a click handler. */
export const user = (isBrowser ? recallUser() : undefined) as ReturnType<
  typeof recallUser
>;
export const SEA = (Gun as unknown as { SEA: any }).SEA;
export const isLoggedIn = () => !!user?.is;
export type GunAck = { err?: string; ok?: number; pub?: string } & Record<
  string,
  unknown
>;
