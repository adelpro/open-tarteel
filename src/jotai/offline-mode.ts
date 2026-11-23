import { createAtomWithStorage } from './create-atom-with-storage';

export type OfflineMode = 'auto' | 'on' | 'off';

export const isOfflineMode = (value: unknown): value is OfflineMode =>
  value === 'auto' || value === 'on' || value === 'off';

const LEGACY_KEY = 'forced-offline';
const MODE_KEY = 'offline-mode';

/**
 * The old forced-offline boolean survives in localStorage for existing users.
 * Fold it into the tri-state preference once, then drop the legacy key so the
 * migration cannot run again with stale data.
 */
export function migrateLegacyForcedOffline(): void {
  if (typeof window === 'undefined') return;

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === null) return;

  if (legacy === 'true') {
    localStorage.setItem(MODE_KEY, JSON.stringify('on'));
  } else if (legacy === 'false') {
    localStorage.setItem(MODE_KEY, JSON.stringify('auto'));
  } else {
    return;
  }

  localStorage.removeItem(LEGACY_KEY);
}

migrateLegacyForcedOffline();

export const offlineModeAtom = createAtomWithStorage<OfflineMode>(
  MODE_KEY,
  'auto',
  { getOnInit: true, validate: isOfflineMode }
);

export function isEffectivelyOffline(
  mode: OfflineMode,
  online: boolean
): boolean {
  return mode === 'on' || (mode === 'auto' && !online);
}
