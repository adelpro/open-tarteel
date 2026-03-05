/**
 * Audio cache management utilities for offline support
 * Handles downloading, storing, and managing cached audio files
 */

export type CacheEntry = {
  url: string;
  surahId: string;
  reciterId: number;
  reciterName: string;
  surahName: string;
  cachedAt: number;
  fileSize: number;
};

export type CacheStats = {
  totalSize: number;
  entriesCount: number;
  availableSpace: number;
};

const DB_NAME = 'open-tarteel-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio-cache';
const CACHE_NAME = 'audio-cache-v1';

/**
 * Initialize IndexedDB for cache metadata
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('surahId', 'surahId', { unique: false });
        store.createIndex('reciterId', 'reciterId', { unique: false });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
  });
}

/**
 * Download and cache a single audio file
 */
export async function cacheAudioFile(
  url: string,
  metadata: Omit<CacheEntry, 'url' | 'cachedAt' | 'fileSize'>
): Promise<void> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    const blob = await response.blob();
    const fileSize = blob.size;

    // Create a new response from the blob
    const blobResponse = new Response(blob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileSize.toString(),
      },
    });

    // Store in cache storage
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, blobResponse);

    // Store metadata in IndexedDB
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const entry: CacheEntry = {
      url,
      ...metadata,
      cachedAt: Date.now(),
      fileSize,
    };

    await new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw new Error(
      `Failed to cache audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a URL is cached
 */
export async function isCached(url: string): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    return !!response;
  } catch {
    return false;
  }
}

/**
 * Get cache entry metadata
 */
export async function getCacheEntry(url: string): Promise<CacheEntry | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Remove a cached audio file
 */
export async function removeCachedAudio(url: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);

    const db = await getDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(url);

      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw new Error(
      `Failed to remove cached audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Remove all cached audios for a specific surah
 */
export async function removeCachedSurah(surahId: string): Promise<void> {
  try {
    const entries = await getCachedEntriesByField('surahId', surahId);
    await Promise.all(entries.map((entry) => removeCachedAudio(entry.url)));
  } catch (error) {
    throw new Error(
      `Failed to remove surah cache: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Remove all cached audios for a specific reciter
 */
export async function removeCachedReciter(reciterId: number): Promise<void> {
  try {
    const entries = await getCachedEntriesByField('reciterId', reciterId);
    await Promise.all(entries.map((entry) => removeCachedAudio(entry.url)));
  } catch (error) {
    throw new Error(
      `Failed to remove reciter cache: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all cached entries
 */
export async function getAllCachedEntries(): Promise<CacheEntry[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Get cached entries filtered by field
 */
async function getCachedEntriesByField(
  field: 'surahId' | 'reciterId',
  value: string | number
): Promise<CacheEntry[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index(field);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const entries = await getAllCachedEntries();
    const totalSize = entries.reduce((sum, entry) => sum + entry.fileSize, 0);

    const estimate = await navigator.storage?.estimate?.();
    const availableSpace = estimate
      ? (estimate.quota || 0) - (estimate.usage || 0)
      : 0;

    return {
      totalSize,
      entriesCount: entries.length,
      availableSpace,
    };
  } catch {
    return {
      totalSize: 0,
      entriesCount: 0,
      availableSpace: 0,
    };
  }
}

/**
 * Clear all cached audio
 */
export async function clearAllCache(): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    await Promise.all(keys.map((req) => cache.delete(req)));

    const db = await getDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw new Error(
      `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Estimate storage usage in human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
