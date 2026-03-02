import { defaultCache } from '@serwist/next/worker';
import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from 'serwist';
import { ExpirationPlugin, Serwist, StaleWhileRevalidate } from 'serwist';

import { DOWNLOAD_STATUS, HttpStatus, SW_EVENTS } from '@/constants';
import { IDB_MODES, swConfig, swError, swLog, swWarn, toError } from '@/utils';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ── Lifecycle: install ───────────────────────────────────────────────────────

self.addEventListener('install', (event: ExtendableEvent) => {
  swLog('INSTALL fired. SW version loaded.');
  event.waitUntil(
    Promise.resolve().then(() => {
      swLog('INSTALL complete.');
    })
  );
});

// ── Lifecycle: activate ──────────────────────────────────────────────────────

self.addEventListener('activate', (event: ExtendableEvent) => {
  swLog('ACTIVATE fired. SW is taking control.');
  event.waitUntil(
    (async () => {
      const clients = await (
        self as unknown as ServiceWorkerGlobalScope & {
          clients: { matchAll: (o: object) => Promise<{ url: string }[]> };
        }
      ).clients.matchAll({ includeUncontrolled: true });
      swLog(
        `ACTIVATE: controlling ${clients.length} client(s):`,
        clients.map((c) => c.url)
      );
      await buildUrlIndex();
      swLog('ACTIVATE: URL index built, SW fully ready.');
    })()
  );
});

// ── IndexedDB ────────────────────────────────────────────────────────────────

function swOpenDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(swConfig.DB_NAME, swConfig.DB_VERSION);

    request.onupgradeneeded = (event) => {
      swLog('IDB onupgradeneeded – creating stores');
      const target = event.target;
      if (!(target instanceof IDBOpenDBRequest)) return;
      const database = target.result;

      const hasTracksStore = database.objectStoreNames.contains(
        swConfig.TRACKS_STORE
      );
      if (hasTracksStore) {
        const tx = target.transaction;
        if (tx) {
          const store = tx.objectStore(swConfig.TRACKS_STORE);
          if (!store.indexNames.contains('url')) {
            store.createIndex('url', 'url', { unique: false });
          }
        }
      } else {
        const store = database.createObjectStore(swConfig.TRACKS_STORE, {
          keyPath: 'id',
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }

      if (!database.objectStoreNames.contains(swConfig.AUDIO_STORE)) {
        database.createObjectStore(swConfig.AUDIO_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      swLog(
        'IDB opened successfully. DB name:',
        swConfig.DB_NAME,
        'version:',
        swConfig.DB_VERSION
      );
      resolve(request.result);
    };
    request.onerror = () => {
      swError('IDB open failed:', request.error);
      reject(toError(request.error));
    };
  });
}

function idbGet<T>(
  database: IDBDatabase,
  store: string,
  key: string
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(store).objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(toError(request.error));
  });
}

function idbPut(
  database: IDBDatabase,
  store: string,
  value: unknown
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(store, IDB_MODES.READWRITE)
      .objectStore(store)
      .put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(toError(request.error));
  });
}

function idbDelete(
  database: IDBDatabase,
  store: string,
  key: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(store, IDB_MODES.READWRITE)
      .objectStore(store)
      .delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(toError(request.error));
  });
}

// ── In-memory URL index ──────────────────────────────────────────────────────

const offlineUrlIndex = new Map<string, string>();

async function buildUrlIndex(): Promise<void> {
  try {
    const database = await swOpenDB();
    const all = await new Promise<
      { id: string; url: string; status: string }[]
    >((resolve, reject) => {
      const request = database
        .transaction(swConfig.TRACKS_STORE)
        .objectStore(swConfig.TRACKS_STORE)
        .getAll();
      request.onsuccess = () =>
        resolve(
          request.result as { id: string; url: string; status: string }[]
        );
      request.onerror = () => reject(toError(request.error));
    });
    offlineUrlIndex.clear();
    for (const t of all) {
      if (t.status === DOWNLOAD_STATUS.DONE) {
        offlineUrlIndex.set(t.url, t.id);
      }
    }
    swLog(`buildUrlIndex: ${offlineUrlIndex.size} offline tracks indexed.`);
    if (offlineUrlIndex.size > 0) {
      swLog('buildUrlIndex: indexed URLs:', [...offlineUrlIndex.keys()]);
    }
  } catch (err) {
    swError('buildUrlIndex failed:', err);
  }
}

// ── Audio helpers ────────────────────────────────────────────────────────────

async function getAudioBuffer(id: string): Promise<ArrayBuffer | undefined> {
  const database = await swOpenDB();
  const row = await idbGet<{ id: string; data: ArrayBuffer }>(
    database,
    swConfig.AUDIO_STORE,
    id
  );
  if (row?.data) {
    swLog(`getAudioBuffer(${id}): found ${row.data.byteLength} bytes`);
  } else {
    swWarn(`getAudioBuffer(${id}): NOT FOUND in IDB`);
  }
  return row?.data;
}

async function getStoredBytes(id: string): Promise<number> {
  return (await getAudioBuffer(id))?.byteLength ?? 0;
}

async function appendBuffer(id: string, chunk: ArrayBuffer): Promise<void> {
  const database = await swOpenDB();
  const existing = await idbGet<{ id: string; data: ArrayBuffer }>(
    database,
    swConfig.AUDIO_STORE,
    id
  );
  let combined: ArrayBuffer;
  if (existing?.data?.byteLength) {
    const temporary = new Uint8Array(
      existing.data.byteLength + chunk.byteLength
    );
    temporary.set(new Uint8Array(existing.data), 0);
    temporary.set(new Uint8Array(chunk), existing.data.byteLength);
    combined = temporary.buffer;
  } else {
    combined = chunk;
  }
  await idbPut(database, swConfig.AUDIO_STORE, { id, data: combined });
}

async function updateTrack(
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const database = await swOpenDB();
  const track = await idbGet<Record<string, unknown>>(
    database,
    swConfig.TRACKS_STORE,
    id
  );
  if (!track) {
    swWarn(
      `updateTrack(${id}): track NOT FOUND in IDB – patch ignored:`,
      patch
    );
    return;
  }
  const updated = { ...track, ...patch };
  await idbPut(database, swConfig.TRACKS_STORE, updated);

  if (typeof track.url === 'string') {
    if (patch.status === DOWNLOAD_STATUS.DONE) {
      offlineUrlIndex.set(track.url, id);
      swLog(`updateTrack: added to URL index: ${track.url}`);
    } else if (patch.status && patch.status !== DOWNLOAD_STATUS.DONE) {
      offlineUrlIndex.delete(track.url);
    }
  }
}

// ── Audio URL detection ──────────────────────────────────────────────────────

function isQuranAudioUrl(url: URL): boolean {
  return (
    url.hostname.endsWith('.mp3quran.net') &&
    /^server\d+$/.test(url.hostname.split('.')[0]) &&
    /\/\d+\.mp3$/.test(url.pathname)
  );
}

function buildRangeResponse(
  data: ArrayBuffer,
  rangeHeader: string | null
): Response {
  const total = data.byteLength;
  const base: Record<string, string> = {
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
  };

  if (rangeHeader) {
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = Number.parseInt(match[1], 10);
      const end = match[2] ? Number.parseInt(match[2], 10) : total - 1;
      const chunk = data.slice(start, end + 1);
      return new Response(chunk, {
        status: HttpStatus.PARTIAL_CONTENT,
        headers: {
          ...base,
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Content-Length': String(chunk.byteLength),
        },
      });
    }
  }

  return new Response(data, {
    status: HttpStatus.OK,
    headers: { ...base, 'Content-Length': String(total) },
  });
}

// ── Fetch listener ───────────────────────────────────────────────────────────

let fetchCount = 0;

self.addEventListener('fetch', (event: FetchEvent) => {
  fetchCount++;
  const url = new URL(event.request.url);
  const seq = fetchCount;

  swLog(`FETCH #${seq} method=${event.request.method} url=${url.href}`);

  if (!isQuranAudioUrl(url)) {
    return swLog(`FETCH #${seq} → not audio URL, skipping`);
  }

  swLog(`FETCH #${seq} → IS audio URL: ${url.href}`);
  swLog(`FETCH #${seq} → offlineUrlIndex size: ${offlineUrlIndex.size}`);
  swLog(`FETCH #${seq} → indexed URLs:`, [...offlineUrlIndex.keys()]);

  const trackId = offlineUrlIndex.get(event.request.url);
  swLog(`FETCH #${seq} → trackId from index: ${trackId ?? 'NOT FOUND'}`);

  if (!trackId) {
    swLog(`FETCH #${seq} → not in offline index, falling through to network`);
    return;
  }

  swLog(`FETCH #${seq} → serving from IDB for trackId: ${trackId}`);

  event.respondWith(
    getAudioBuffer(trackId)
      .then((audioData) => {
        if (audioData) {
          const range = event.request.headers.get('range');
          swLog(
            `FETCH #${seq} → serving ${audioData.byteLength} bytes, range: ${range}`
          );
          return buildRangeResponse(audioData, range);
        }
        swWarn(
          `FETCH #${seq} → IDB had no data despite index entry, falling to network`
        );
        offlineUrlIndex.delete(event.request.url);
        return fetch(event.request);
      })
      .catch((err) => {
        swError(`FETCH #${seq} → error serving from IDB:`, err);
        return fetch(event.request);
      })
  );
});

// ── Serwist ──────────────────────────────────────────────────────────────────

swLog('SW module loaded. Initializing Serwist...');

const cacheStrategies: RuntimeCaching[] = [
  // ── RSC prefetch requests (Next.js router prefetch) ─────────────────────
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get('RSC') === '1' &&
      request.headers.get('Next-Router-Prefetch') === '1' &&
      sameOrigin &&
      !pathname.startsWith('/api/'),
    handler: new StaleWhileRevalidate({
      cacheName: 'pages-rsc-prefetch',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  },
  // ── RSC navigation requests ──────────────────────────────────────────────
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get('RSC') === '1' &&
      sameOrigin &&
      !pathname.startsWith('/api/'),
    handler: new StaleWhileRevalidate({
      cacheName: 'pages-rsc',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  },
  // ── HTML pages ───────────────────────────────────────────────────────────
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get('Accept')?.includes('text/html') &&
      sameOrigin &&
      !pathname.startsWith('/api/'),
    handler: new StaleWhileRevalidate({
      cacheName: 'pages',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60,
          maxAgeFrom: 'last-used',
        }),
      ],
    }),
  },
  // API GET
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      request.method === 'GET' &&
      url.pathname.startsWith('/api/'),
    handler: new StaleWhileRevalidate({
      cacheName: 'api-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60,
        }),
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...cacheStrategies, ...defaultCache],
});

serwist.addEventListeners();

swLog('Serwist initialized. SW script fully evaluated.');

// ── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', async (event: ExtendableMessageEvent) => {
  const { type, id, url } = event.data || {};

  swLog(`MESSAGE type=${type} id=${id} url=${url}`);
  swLog(`MESSAGE ports count: ${event.ports.length}`);

  swLog(`MESSAGE type=${type} id=${id}`);

  if (type === SW_EVENTS.PING) {
    swLog('PING received → sending PONG');
    event.ports[0]?.postMessage({ type: SW_EVENTS.PONG });
    return;
  }

  if (type === 'DIAG_INDEX') {
    event.ports[0]?.postMessage({
      type: 'DIAG_INDEX_RESULT',
      size: offlineUrlIndex.size,
      urls: [...offlineUrlIndex.keys()],
    });
    return;
  }

  if (type === SW_EVENTS.ESTIMATE_SIZE) {
    try {
      swLog(`ESTIMATE_SIZE for url: ${url}`);
      const response = await fetch(url, { method: 'HEAD' });
      const totalSize = Number(response.headers.get('content-length') ?? 0);
      const alreadyDownloaded = await getStoredBytes(id);
      swLog(
        `ESTIMATE_SIZE result: total=${totalSize} already=${alreadyDownloaded}`
      );
      event.ports[0]?.postMessage({
        type: SW_EVENTS.SIZE_RESULT,
        totalSize,
        alreadyDownloaded,
      });
    } catch (err) {
      swError('ESTIMATE_SIZE error:', err);
      event.ports[0]?.postMessage({
        type: SW_EVENTS.SIZE_RESULT,
        totalSize: 0,
        error: true,
      });
    }
    return;
  }

  if (type === SW_EVENTS.DOWNLOAD_TRACK || type === SW_EVENTS.RESUME_DOWNLOAD) {
    const {
      id,
      url,
      link,
      reciterId,
      moshafId,
      surahId,
      reciterName,
      moshafName,
      surahName,
      surahNameEn,
      duration,
      addedAt,
    } = event.data;

    const isResume = type === SW_EVENTS.RESUME_DOWNLOAD;

    try {
      const database = await swOpenDB();
      const existing = await idbGet<{ id: string }>(
        database,
        swConfig.TRACKS_STORE,
        id
      );

      if (existing) {
        // Already exists — patch metadata in case it was a minimal stub
        await updateTrack(id, {
          link: link ?? url,
          reciterId,
          moshafId,
          surahId,
          reciterName,
          moshafName,
          surahName,
          surahNameEn,
          duration,
        });
        swLog(`${type}: patched existing record for id=${id}`);
      } else {
        // Persist FULL metadata — survives hard reload
        await idbPut(database, swConfig.TRACKS_STORE, {
          id,
          url,
          link: link ?? url,
          reciterId,
          moshafId,
          surahId,
          reciterName,
          moshafName,
          surahName,
          surahNameEn,
          duration,
          status: isResume ? DOWNLOAD_STATUS.PAUSED : DOWNLOAD_STATUS.IDLE,
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          speed: 0,
          addedAt: addedAt ?? Date.now(),
        });
        swLog(`${type}: full track record written for id=${id}`);
      }
    } catch (err) {
      swError(`${type}: could not write track record:`, err);
    }

    event.waitUntil(handleDownload(event, id, url, isResume));
    return;
  }

  if (type === SW_EVENTS.PAUSE_DOWNLOAD) {
    swLog(`PAUSE_DOWNLOAD id=${id}`);
    const ctrl = activeDownloads.get(id);
    if (ctrl) {
      ctrl.abort();
      activeDownloads.delete(id);
      await updateTrack(id, { status: DOWNLOAD_STATUS.PAUSED });
      swLog(`PAUSE_DOWNLOAD: aborted and marked paused for id=${id}`);
    } else {
      swWarn(`PAUSE_DOWNLOAD: no active download found for id=${id}`);
    }
    event.ports[0]?.postMessage({ paused: true });
    return;
  }

  if (type === SW_EVENTS.CANCEL_DOWNLOAD) {
    swLog(`CANCEL_DOWNLOAD id=${id}`);
    const ctrl = activeDownloads.get(id);
    if (ctrl) {
      ctrl.abort();
      activeDownloads.delete(id);
    }
    const database = await swOpenDB();
    await idbDelete(database, swConfig.AUDIO_STORE, id);
    await updateTrack(id, {
      status: DOWNLOAD_STATUS.IDLE,
      progress: 0,
      downloadedBytes: 0,
    });
    event.ports[0]?.postMessage({ canceled: true });
    return;
  }

  if (type === SW_EVENTS.CLEAR_AUDIO) {
    swLog(`CLEAR_AUDIO id=${id}`);
    const database = await swOpenDB();
    const track = await idbGet<{ url: string }>(
      database,
      swConfig.TRACKS_STORE,
      id
    );
    if (track?.url) offlineUrlIndex.delete(track.url);
    await idbDelete(database, swConfig.AUDIO_STORE, id);
    await updateTrack(id, {
      status: DOWNLOAD_STATUS.IDLE,
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    });
    event.ports[0]?.postMessage({ cleared: true });
    return;
  }

  if (type === SW_EVENTS.CLEAR_TRACK) {
    swLog(`CLEAR_TRACK id=${id}`);
    const database = await swOpenDB();
    const track = await idbGet<{ url: string }>(
      database,
      swConfig.TRACKS_STORE,
      id
    );
    if (track?.url) offlineUrlIndex.delete(track.url);
    await idbDelete(database, swConfig.TRACKS_STORE, id);
    await idbDelete(database, swConfig.AUDIO_STORE, id);
    event.ports[0]?.postMessage({ cleared: true });
  }

  if (type === SW_EVENTS.GET_STORAGE_STATS) {
    try {
      const database = await swOpenDB();
      const tracks = await new Promise<{ id: string }[]>((resolve, reject) => {
        const request = database
          .transaction(swConfig.TRACKS_STORE)
          .objectStore(swConfig.TRACKS_STORE)
          .getAll();
        request.onsuccess = () => resolve(request.result as { id: string }[]);
        request.onerror = () => reject(toError(request.error));
      });

      let totalBytes = 0;
      for (const t of tracks) {
        const audio = await idbGet<{ id: string; data: ArrayBuffer }>(
          database,
          swConfig.AUDIO_STORE,
          t.id
        );
        if (audio?.data) totalBytes += audio.data.byteLength;
      }

      event.ports[0]?.postMessage({ totalBytes, trackCount: tracks.length });
    } catch (err) {
      swError('GET_STORAGE_STATS:', err);
      event.ports[0]?.postMessage({ totalBytes: 0, trackCount: 0 });
    }
    return;
  }

  if (type === SW_EVENTS.CLEAR_ALL_TRACKS) {
    try {
      // Abort any in-progress downloads first
      for (const [, ctrl] of activeDownloads) ctrl.abort();
      activeDownloads.clear();

      const database = await swOpenDB();
      await new Promise<void>((resolve, reject) => {
        const request = database
          .transaction(swConfig.AUDIO_STORE, IDB_MODES.READWRITE)
          .objectStore(swConfig.AUDIO_STORE)
          .clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(toError(request.error));
      });
      await new Promise<void>((resolve, reject) => {
        const request = database
          .transaction(swConfig.TRACKS_STORE, IDB_MODES.READWRITE)
          .objectStore(swConfig.TRACKS_STORE)
          .clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(toError(request.error));
      });

      offlineUrlIndex.clear();
      event.ports[0]?.postMessage({ cleared: true });
    } catch (err) {
      swError('CLEAR_ALL_TRACKS:', err);
      event.ports[0]?.postMessage({ cleared: false, error: String(err) });
    }
    return null;
  }
});

// ── Download state ───────────────────────────────────────────────────────────

const activeDownloads = new Map<string, AbortController>();

// ── Download core ────────────────────────────────────────────────────────────

async function handleDownload(
  event: ExtendableMessageEvent,
  id: string,
  url: string,
  resume: boolean
): Promise<void> {
  swLog(`handleDownload START id=${id} resume=${resume} url=${url}`);
  const controller = new AbortController();
  activeDownloads.set(id, controller);

  try {
    const context = await createDownloadRequest(id, url, resume, controller);
    swLog(`handleDownload: stream ready. totalBytes=${context.totalBytes}`);
    await processStream(event, id, context);
    await finalizeDownload(event, id, context.downloadedBytes);
    swLog(`handleDownload DONE id=${id}`);
  } catch (err) {
    await handleDownloadError(event, id, err);
  } finally {
    activeDownloads.delete(id);
  }
}

async function createDownloadRequest(
  id: string,
  url: string,
  resume: boolean,
  controller: AbortController
) {
  const alreadyStored = resume ? await getStoredBytes(id) : 0;
  swLog(`createDownloadRequest: alreadyStored=${alreadyStored}`);

  const headers: Record<string, string> = {};
  if (alreadyStored > 0) headers.Range = `bytes=${alreadyStored}-`;

  const response = await fetch(url, { signal: controller.signal, headers });
  swLog(`createDownloadRequest: response status=${response.status}`);

  if (!response.ok && response.status !== HttpStatus.PARTIAL_CONTENT) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  const totalBytes = alreadyStored + contentLength;

  await updateTrack(id, {
    status: DOWNLOAD_STATUS.DOWNLOADING,
    totalBytes,
    downloadedBytes: alreadyStored,
  });

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  return { reader, totalBytes, downloadedBytes: alreadyStored };
}

async function processStream(
  event: ExtendableMessageEvent,
  id: string,
  context: {
    reader: ReadableStreamDefaultReader<Uint8Array>;
    totalBytes: number;
    downloadedBytes: number;
  }
) {
  const { reader, totalBytes } = context;
  const flushBuffer = createFlushBuffer(id);
  let lastReportTime = Date.now();
  let lastReportBytes = context.downloadedBytes;

  sendProgress(event, context.downloadedBytes, totalBytes, 0);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    context.downloadedBytes += value.length;
    await flushBuffer.add(value);

    const now = Date.now();
    const elapsed = now - lastReportTime;

    if (elapsed >= 500) {
      const speed = calculateSpeed(
        context.downloadedBytes,
        lastReportBytes,
        elapsed
      );
      sendProgress(event, context.downloadedBytes, totalBytes, speed);
      await updateTrack(id, {
        downloadedBytes: context.downloadedBytes,
        progress: calculateProgress(context.downloadedBytes, totalBytes),
      });
      lastReportTime = now;
      lastReportBytes = context.downloadedBytes;
    }
  }

  await flushBuffer.flush();
}

function createFlushBuffer(id: string) {
  const FLUSH_THRESHOLD = 512 * 1024;
  const chunks: Uint8Array[] = [];
  let size = 0;

  return {
    async add(chunk: Uint8Array) {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= FLUSH_THRESHOLD) await this.flush();
    },
    async flush() {
      if (!chunks.length) return;
      const merged = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      await appendBuffer(id, merged.buffer);
      swLog(`flush: wrote ${size} bytes to IDB for id=${id}`);
      chunks.length = 0;
      size = 0;
    },
  };
}

function sendProgress(
  event: ExtendableMessageEvent,
  downloaded: number,
  total: number,
  speed: number
) {
  event.ports[0]?.postMessage({
    type: SW_EVENTS.DOWNLOAD_PROGRESS,
    progress: calculateProgress(downloaded, total),
    speed,
    downloadedBytes: downloaded,
    totalBytes: total,
  });
}

function calculateProgress(downloaded: number, total: number) {
  return total ? Math.round((downloaded / total) * 100) : 0;
}

function calculateSpeed(current: number, previous: number, elapsed: number) {
  return Math.round((((current - previous) / elapsed) * 1000) / 1024);
}

async function finalizeDownload(
  event: ExtendableMessageEvent,
  id: string,
  downloadedBytes: number
) {
  await updateTrack(id, {
    status: DOWNLOAD_STATUS.DONE,
    progress: 100,
    downloadedBytes,
  });
  event.ports[0]?.postMessage({ success: true });
}

async function handleDownloadError(
  event: ExtendableMessageEvent,
  id: string,
  err: unknown
) {
  if ((err as Error)?.name === 'AbortError') {
    swLog(
      `handleDownloadError: AbortError for id=${id} (pause/cancel, expected)`
    );
    return;
  }
  swError('handleDownloadError:', err);
  await updateTrack(id, { status: DOWNLOAD_STATUS.ERROR });
  event.ports[0]?.postMessage({ success: false, error: String(err) });
}
