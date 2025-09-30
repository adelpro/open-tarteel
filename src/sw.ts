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
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
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
