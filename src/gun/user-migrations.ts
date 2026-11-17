import { CURRENT_USER_SCHEMA_VERSION } from './user-schema';

export type UserGraphSnapshot = Record<string, unknown>;

type UserMigration = {
  from: number;
  to: number;
  migrate: (data: UserGraphSnapshot) => UserGraphSnapshot;
};

const migrations: UserMigration[] = [];

// Add migrations here as schema evolves
// Example: { from: 0, to: 1, migrate: (d) => ({ ...d, favorites: normalize(d.favorites) }) }

export function migrateUserGraph(
  snapshot: UserGraphSnapshot,
  fromVersion: number
): UserGraphSnapshot {
  let current: UserGraphSnapshot = { ...snapshot };
  let version = fromVersion || 0;
  for (const migration of migrations) {
    if (migration.from === version) {
      current = migration.migrate(current);
      version = migration.to;
      if (version >= CURRENT_USER_SCHEMA_VERSION) break;
    }
  }
  if (version < CURRENT_USER_SCHEMA_VERSION) {
    version = CURRENT_USER_SCHEMA_VERSION;
  }
  return { ...current, _schemaVersion: version };
}
