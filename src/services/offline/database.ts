import type { OfflineDownloadRecord } from './types';

const DB_NAME = 'open-tarteel-offline';
const STORE_NAME = 'downloads';
const DB_VERSION = 1;

let databasePromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function getAllDownloads(): Promise<OfflineDownloadRecord[]> {
  const database = await openDatabase();
  if (!database) return [];

  const transaction = database.transaction(STORE_NAME, 'readonly');
  const request = transaction.objectStore(STORE_NAME).getAll();
  const rows = await requestToPromise<OfflineDownloadRecord[]>(request);
  return rows ?? [];
}

export async function putDownload(
  record: OfflineDownloadRecord
): Promise<boolean> {
  return putDownloads([record]);
}

export async function putDownloads(
  records: OfflineDownloadRecord[]
): Promise<boolean> {
  if (records.length === 0) return true;
  const database = await openDatabase();
  if (!database) return false;

  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  for (const record of records) store.put(record);

  return new Promise((resolve) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => resolve(false);
    transaction.onabort = () => resolve(false);
  });
}

export async function deleteDownloads(urls: string[]): Promise<boolean> {
  if (urls.length === 0) return true;
  const database = await openDatabase();
  if (!database) return false;

  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  for (const url of urls) store.delete(url);

  return new Promise((resolve) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => resolve(false);
    transaction.onabort = () => resolve(false);
  });
}

export async function clearDownloads(): Promise<boolean> {
  const database = await openDatabase();
  if (!database) return false;

  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).clear();

  return new Promise((resolve) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => resolve(false);
    transaction.onabort = () => resolve(false);
  });
}
