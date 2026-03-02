import { DOWNLOAD_STATUS } from '@/constants';
import { type Track } from '@/types';
import { swConfig, toError } from '@/utils';

export const IDB_MODES = {
  READONLY: 'readonly',
  READWRITE: 'readwrite',
  VERSIONCHANGE: 'versionchange',
} as const;

export type IDBMode = (typeof IDB_MODES)[keyof typeof IDB_MODES];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(swConfig.DB_NAME, swConfig.DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(swConfig.TRACKS_STORE)) {
        const trackStore = database.createObjectStore(swConfig.TRACKS_STORE, {
          keyPath: 'id',
        });
        trackStore.createIndex('reciterId', 'reciterId', { unique: false });
        trackStore.createIndex('moshafId', 'moshafId', { unique: false });
        trackStore.createIndex('status', 'status', { unique: false });
      }

      // AUDIO_STORE is created here to keep schema in sync with SW,
      // but the client NEVER reads/writes audio data — that's SW-only.
      if (!database.objectStoreNames.contains(swConfig.AUDIO_STORE)) {
        database.createObjectStore(swConfig.AUDIO_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toError(request.error));
  });
}

function tx(
  database: IDBDatabase,
  stores: string | string[],
  mode: IDBMode = IDB_MODES.READONLY
): IDBTransaction {
  return database.transaction(stores, mode);
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toError(request.error));
  });
}

// ── KEEP: Track metadata reads/writes ────────────────────────────────────────

export async function getTrack(id: string): Promise<Track | undefined> {
  const database = await openDB();
  return promisify(
    tx(database, swConfig.TRACKS_STORE)
      .objectStore(swConfig.TRACKS_STORE)
      .get(id)
  );
}

export async function getAllTracks(): Promise<Track[]> {
  const database = await openDB();
  return promisify(
    tx(database, swConfig.TRACKS_STORE)
      .objectStore(swConfig.TRACKS_STORE)
      .getAll()
  );
}

export async function putTrack(track: Track): Promise<void> {
  const database = await openDB();
  await promisify(
    tx(database, swConfig.TRACKS_STORE, IDB_MODES.READWRITE)
      .objectStore(swConfig.TRACKS_STORE)
      .put(track)
  );
}

export async function updateTrackStatus(
  id: string,
  patch: Partial<
    Pick<
      Track,
      'status' | 'progress' | 'downloadedBytes' | 'totalBytes' | 'speed'
    >
  >
): Promise<void> {
  const database = await openDB();
  const store = tx(
    database,
    swConfig.TRACKS_STORE,
    IDB_MODES.READWRITE
  ).objectStore(swConfig.TRACKS_STORE);
  const track: Track | undefined = await promisify(store.get(id));
  if (!track) return;
  await promisify(store.put({ ...track, ...patch }));
}

export async function deleteTrack(id: string): Promise<void> {
  const database = await openDB();
  const t = tx(
    database,
    [swConfig.TRACKS_STORE, swConfig.AUDIO_STORE],
    IDB_MODES.READWRITE
  );
  t.objectStore(swConfig.TRACKS_STORE).delete(id);
  t.objectStore(swConfig.AUDIO_STORE).delete(id);
  await new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(toError(t.error));
  });
}

export async function trackExists(id: string): Promise<boolean> {
  return !!(await getTrack(id));
}

export async function isTrackOffline(id: string): Promise<boolean> {
  const track = await getTrack(id);
  return track?.status === DOWNLOAD_STATUS.DONE;
}
