/**
 * The localStorage keys the account ring adds, and its one window event.
 *
 * The app's existing keys are unprefixed (`favorite-reciter`,
 * `theme-preference`, …) and stay that way: renaming them would need a
 * copy-forward migration, or every listener would lose their favourites and
 * settings on the next deploy. Only the keys introduced here carry `tarteel:`.
 */
export const STORAGE_KEYS = {
  /** The SEA keypair. Losing it on the last device loses the ring. */
  account: 'tarteel:account',
  deviceId: 'tarteel:device-id',
  deviceName: 'tarteel:device-name',
  deviceLinkedAt: 'tarteel:device-linked-at',
  /** When this device last changed a synced setting, in ms. */
  settingsUpdatedAt: 'tarteel:settings-updated-at',
} as const;

/** Existing, unprefixed keys the ring reads without going through an atom. */
export const APP_STORAGE_KEYS = {
  favorites: 'favorite-reciter',
} as const;

/**
 * Dispatched when the listener changes a synced setting on this device. The
 * account sync hears it and pushes the settings to the ring. Values that
 * arrive from the ring never dispatch it, so they cannot bounce back.
 */
export const SETTINGS_EVENT = 'tarteel:settings';
