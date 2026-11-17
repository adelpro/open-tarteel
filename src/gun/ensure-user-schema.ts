'use client';
import { user } from './index';
import { once } from './once';
import { migrateUserGraph, type UserGraphSnapshot } from './user-migrations';
import { CURRENT_USER_SCHEMA_VERSION } from './user-schema';

/**
 * The paths a future migration is allowed to touch.
 *
 * Tilawa also lists `recentlyViewed`; Open Tarteel does not sync recently
 * played, so there is no such path to migrate. Session state (`reciter`,
 * `surah`, `progress`) is deliberately absent: the playhead never leaves the
 * device.
 */
const MIGRATED_PATHS = ['profile', 'settings', 'favorites', 'devices'];

async function snapshotUserGraph(): Promise<UserGraphSnapshot> {
  if (!user?.is) return {};
  const entries = await Promise.all(
    MIGRATED_PATHS.map(async (key) => {
      const value = await once(user.get(key));
      return [key, value] as const;
    })
  );
  const snapshot: UserGraphSnapshot = {};
  for (const [key, value] of entries) {
    if (value && typeof value === 'object') snapshot[key] = value;
  }
  return snapshot;
}

/**
 * Runs once per login. Additive schema changes need no migration, so this is a
 * no-op on the common path: one read, then nothing. The snapshot only runs when
 * a real migration exists for a version this account is still on.
 */
export async function ensureUserSchema(): Promise<void> {
  if (!user?.is) return;

  try {
    const schema = await once<{ version?: number }>(user.get('schema'));
    const fromVersion =
      typeof schema?.version === 'number' ? schema.version : 0;

    if (fromVersion >= CURRENT_USER_SCHEMA_VERSION) return;

    if (fromVersion > 0) {
      const migrated = migrateUserGraph(await snapshotUserGraph(), fromVersion);
      for (const [key, value] of Object.entries(migrated)) {
        if (key === '_schemaVersion') continue;
        if (value && typeof value === 'object') user.get(key).put(value as any);
      }
    }

    user
      .get('schema')
      .put({ version: CURRENT_USER_SCHEMA_VERSION, updatedAt: Date.now() });
  } catch {
    // A schema stamp is not worth blocking playback or favourites.
  }
}
