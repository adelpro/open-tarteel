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

// ── Offline-downloads cache name (shared with useOfflineDownload hook) ──
const OFFLINE_CACHE = 'quran-offline-downloads';

// Custom handler: serve from the explicit offline cache first, then
// fall back to the runtime CacheFirst strategy.
const quranAudioCache = {
  matcher: ({ url }: { url: URL }) => {
    // Match MP3Quran audio files
    if (
      url.hostname.endsWith('.mp3quran.net') &&
      /^server\d+$/.test(url.hostname.split('.')[0]) &&
      /^\d+\.mp3$/.test(url.pathname.slice(1))
    ) {
      return true;
    }

    // Match Itqan audio CDN
    if (url.hostname.includes('itqan')) {
      return true;
    }

    // Match Qurani.ai audio CDN (full-surah and verse-by-verse audio files)
    if (
      url.hostname === 'quranhub.b-cdn.net' &&
      (url.pathname.startsWith('/quran/audio/surah/') ||
        url.pathname.startsWith('/quran/audio/versebyverse/')) &&
      /\.mp3$/i.test(url.pathname)
    ) {
      return true;
    }

    // Match Quran Foundation audio CDN
    if (url.hostname.endsWith('quranicaudio.com')) {
      return true;
    }

    return false;
  },

  handler: new CacheFirst({
    cacheName: 'quran-audio',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
};

// Intercept fetch events to check the offline-downloads cache first
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  const isAudio =
    (url.hostname.endsWith('.mp3quran.net') &&
      /^server\d+$/.test(url.hostname.split('.')[0]) &&
      /^\d+\.mp3$/.test(url.pathname.slice(1))) ||
    url.hostname.includes('itqan') ||
    (url.hostname === 'quranhub.b-cdn.net' &&
      (url.pathname.startsWith('/quran/audio/surah/') ||
        url.pathname.startsWith('/quran/audio/versebyverse/')) &&
      /\.mp3$/i.test(url.pathname)) ||
    url.hostname.endsWith('quranicaudio.com');

  if (isAudio) {
    event.respondWith(
      caches
        .open(OFFLINE_CACHE)
        .then((cache) => cache.match(event.request))
        .then((cached) => cached || fetch(event.request))
    );
  }
});

// API caching for reciters list
const apiCache = {
  matcher: ({ url }: { url: URL }) => {
    return url.pathname.startsWith('/api/reciters');
  },

  handler: new CacheFirst({
    cacheName: 'api-reciters',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
};

// Runtime caching: prepend our rules before defaults
const runtimeCaching = [quranAudioCache, apiCache, ...defaultCache];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();