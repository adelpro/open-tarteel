import { LinkSource } from '@/types';
import { SETTINGS_EVENT, STORAGE_KEYS } from '@/utils/storage/storage-keys';
import {
  VISUALISER_MODELS,
  type VisualiserModel,
} from '@/utils/visualiser-models';

/**
 * The settings a ring carries between devices: appearance, sources, sort,
 * spectrum and speed. Volume, playback mode, fullscreen and the selected
 * reciter stay on the device — the room, not the account, decides them.
 *
 * Tilawa keeps one settings object in a single storage key; Open Tarteel keeps
 * one atom per setting. This module is the bridge: the same last-write-wins
 * rules as Tilawa's `resolveRemoteSettings` / `shouldPushLocalSettings`, over
 * Tarteel's fields.
 */

export const THEMES = ['light', 'dark', 'system'] as const;
export const PALETTES = ['classic', 'warm', 'night'] as const;
export const RECITER_SORTS = ['popular', 'alphabetical', 'views'] as const;
/** The steps the speed button cycles through. */
export const PLAYBACK_SPEEDS = [1, 1.5, 2] as const;

export type SyncedSettings = {
  theme: (typeof THEMES)[number];
  palette: (typeof PALETTES)[number];
  sources: LinkSource[];
  sort: (typeof RECITER_SORTS)[number];
  visualizer: VisualiserModel;
  speed: number;
};

/**
 * The account's `settings` node.
 *
 * Gun stores no arrays, so `sources` travels as a JSON string. The whole object
 * is written in one put with one stamp: two devices changing different fields
 * in the same second each send a complete picture.
 */
export type RemoteSettings = {
  theme?: string;
  palette?: string;
  sources?: string;
  sort?: string;
  visualizer?: string;
  speed?: number;
  updatedAt?: number;
};

/** The strict shape a remote payload has to earn before it reaches the atoms. */
export type ResolvedSettings = Partial<SyncedSettings> & { updatedAt: number };

type LocalStamp = { updatedAt?: number };

/** A wrong clock must not win forever: stamps this far ahead are ignored. */
const MAX_CLOCK_SKEW = 60_000;

const SOURCES = Object.values(LinkSource) as readonly string[];

const numberOrUndefined = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

function oneOf<T extends string>(
  list: readonly T[],
  value: unknown
): T | undefined {
  return typeof value === 'string' &&
    (list as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function parseSources(value: unknown): LinkSource[] | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    const known = parsed.filter(
      (source): source is LinkSource =>
        typeof source === 'string' && SOURCES.includes(source)
    );
    // The settings page keeps at least one source on; so does the ring.
    return known.length > 0 ? [...new Set(known)] : undefined;
  } catch {
    return undefined;
  }
}

export function toRemoteSettings(
  settings: SyncedSettings,
  updatedAt: number
): RemoteSettings {
  return {
    theme: settings.theme,
    palette: settings.palette,
    sources: JSON.stringify(settings.sources),
    sort: settings.sort,
    visualizer: settings.visualizer,
    speed: settings.speed,
    updatedAt,
  };
}

/**
 * Decide whether the account's settings should replace this device's.
 *
 * Pure and total: a malformed relay payload degrades to "nothing to apply".
 * `now` is a parameter so the clock-skew rule is testable without faking time.
 */
export function resolveRemoteSettings(
  local: LocalStamp,
  remote: unknown,
  now: number = Date.now()
): ResolvedSettings | null {
  if (!remote || typeof remote !== 'object') return null;

  const source = remote as Record<string, unknown>;
  const stamp = numberOrUndefined(source.updatedAt) ?? 0;
  const localStamp = numberOrUndefined(local.updatedAt) ?? 0;

  // Not strictly newer: the stamp this device just wrote is about to echo back.
  if (stamp <= localStamp) return null;
  if (stamp > now + MAX_CLOCK_SKEW) return null;

  const resolved: ResolvedSettings = { updatedAt: stamp };

  const theme = oneOf(THEMES, source.theme);
  if (theme) resolved.theme = theme;
  const palette = oneOf(PALETTES, source.palette);
  if (palette) resolved.palette = palette;
  const sources = parseSources(source.sources);
  if (sources) resolved.sources = sources;
  const sort = oneOf(RECITER_SORTS, source.sort);
  if (sort) resolved.sort = sort;
  const visualizer = oneOf(VISUALISER_MODELS, source.visualizer);
  if (visualizer) resolved.visualizer = visualizer;
  const speed = numberOrUndefined(source.speed);
  if (
    speed !== undefined &&
    (PLAYBACK_SPEEDS as readonly number[]).includes(speed)
  ) {
    resolved.speed = speed;
  }

  // A stamp with no usable field is not worth a re-render.
  return Object.keys(resolved).length > 1 ? resolved : null;
}

/**
 * The other half of last-write-wins: a device that changed a setting offline
 * holds the newest value, so login has to push it instead of quietly dropping
 * it. A missing local stamp means "this device never chose anything" — its
 * defaults must not overwrite the account.
 */
export function shouldPushLocalSettings(
  local: LocalStamp,
  remote: unknown,
  now: number = Date.now()
): boolean {
  const localStamp = numberOrUndefined(local.updatedAt) ?? 0;
  if (localStamp === 0) return false;
  if (localStamp > now + MAX_CLOCK_SKEW) return false;

  const remoteStamp =
    remote && typeof remote === 'object'
      ? (numberOrUndefined((remote as Record<string, unknown>).updatedAt) ?? 0)
      : 0;

  return localStamp > remoteStamp;
}

export function readSettingsStamp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stamp = Number(
      window.localStorage.getItem(STORAGE_KEYS.settingsUpdatedAt)
    );
    return Number.isFinite(stamp) && stamp > 0 ? stamp : 0;
  } catch {
    return 0;
  }
}

export function writeSettingsStamp(stamp: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.settingsUpdatedAt, String(stamp));
  } catch {
    // private mode: the in-memory atoms still hold the value
  }
}

/**
 * A synced setting was changed on this device, by the listener.
 *
 * Stamps first, then tells the account sync. Tilawa's `patchSettings` does the
 * same in one place; here every synced atom's setter calls it.
 */
export function markSettingsChanged(now: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  writeSettingsStamp(now);
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}
