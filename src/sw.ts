import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  Serwist,
} from 'serwist';

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Add runtime caching for MP3Quran audio files
const quranAudioCache = {
  matcher: ({ url }: { url: URL }) => {
    // Match only MP3Quran audio files: https://server12.mp3quran.net/001.mp3
    return (
      url.hostname.endsWith('.mp3quran.net') &&
      /^server\d+$/.test(url.hostname.split('.')[0]) &&
      /^\d+\.mp3$/.test(url.pathname.slice(1))
    );
  },
  handler: new CacheFirst({
    cacheName: 'quran-audio',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 114, // Increase max entries to allow caching full moshaf if streaming
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
};

// Runtime caching: prepend our rule before defaults
const runtimeCaching = [quranAudioCache, ...defaultCache];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();

const abortControllers = new Map<string, AbortController>();

// Add listener for caching audio and offline downloads
self.addEventListener('message', async (event) => {
  if (event.data && event.data.action === 'GET_FILE_SIZE') {
    const { url } = event.data;
    if (url) {
      try {
        const cache = await caches.open('quran-audio');
        const cachedRes = await cache.match(url);
        if (cachedRes) {
          let size = 0;
          const sizeStr = cachedRes.headers.get('content-length');
          if (sizeStr) size = parseInt(sizeStr, 10);
          else {
            const blob = await cachedRes.clone().blob();
            size = blob.size;
          }
          event.ports[0]?.postMessage({ success: true, url, size, cached: true });
          return;
        }

        const headRes = await fetch(url, { method: 'HEAD' });
        const sizeStr = headRes.headers.get('content-length');
        const size = sizeStr ? parseInt(sizeStr, 10) : 0;
        event.ports[0]?.postMessage({ success: true, url, size, cached: false });
      } catch (error: any) {
        event.ports[0]?.postMessage({ success: false, url, error: error.message });
      }
    }
  } else if (event.data && event.data.action === 'CACHE_AUDIO') {
    const { url } = event.data;
    if (url) {
      if (abortControllers.has(url)) {
        abortControllers.get(url)?.abort();
        abortControllers.delete(url);
      }

      const controller = new AbortController();
      abortControllers.set(url, controller);

      try {
        const cache = await caches.open('quran-audio');
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          event.ports[0]?.postMessage({ success: false, url, error: 'Network response was not ok' });
          abortControllers.delete(url);
          return;
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const cloneForCache = response.clone();
        const cachePromise = cache.put(url, cloneForCache);

        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.length;
            event.ports[0]?.postMessage({ progress: true, url, loaded, total });
          }
        }

        await cachePromise;
        abortControllers.delete(url);
        event.ports[0]?.postMessage({ success: true, url, total, loaded: total });
      } catch (error: any) {
        abortControllers.delete(url);
        if (error.name === 'AbortError') {
          event.ports[0]?.postMessage({ success: false, url, aborted: true });
        } else {
          event.ports[0]?.postMessage({ success: false, url, error: error.message });
        }
      }
    }
  } else if (event.data && event.data.action === 'ABORT_AUDIO') {
    const { url } = event.data;
    if (url && abortControllers.has(url)) {
      abortControllers.get(url)?.abort();
      abortControllers.delete(url);
      event.ports[0]?.postMessage({ success: true, url });
    }
  } else if (event.data && event.data.action === 'REMOVE_AUDIO') {
    const { url } = event.data;
    if (url) {
      try {
        const cache = await caches.open('quran-audio');
        const deleted = await cache.delete(url);
        event.ports[0]?.postMessage({ success: deleted, url });
      } catch (error: any) {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      }
    }
  } else if (event.data && event.data.action === 'CHECK_CACHED') {
    const { url } = event.data;
    if (url) {
      try {
        const cache = await caches.open('quran-audio');
        const response = await cache.match(url);

        let size = 0;
        if (response) {
          const sizeStr = response.headers.get('content-length');
          if (sizeStr) size = parseInt(sizeStr, 10);
          else {
            const blob = await response.clone().blob();
            size = blob.size;
          }
        }

        event.ports[0]?.postMessage({
          success: true,
          isCached: !!response,
          url,
          size
        });
      } catch (error: any) {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      }
    }
  }
});
