import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  type HandlerCallbackOptions,
  NetworkFirst,
  Serwist,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const OFFLINE_CACHE = 'quran-offline-downloads';
const AUDIO_RUNTIME_CACHE = 'quran-audio';

function isQuranAudioUrl(url: URL): boolean {
  if (
    url.hostname.endsWith('.mp3quran.net') &&
    /^server\d+$/.test(url.hostname.split('.')[0]) &&
    /\/\d+\.mp3$/.test(url.pathname)
  ) {
    return true;
  }
  if (url.hostname === 'itqan.dev' || url.hostname.endsWith('.itqan.dev')) {
    return true;
  }
  return false;
}

// Unified audio handler: check explicit downloads cache first,
// then fall through to CacheFirst runtime strategy.
const audioCacheFirst = new CacheFirst({
  cacheName: AUDIO_RUNTIME_CACHE,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 300,
      maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
    }),
    new CacheableResponsePlugin({
      statuses: [200],
    }),
  ],
});

const quranAudioCache = {
  matcher: ({ url }: { url: URL }) => {
    if (isQuranAudioUrl(url)) return true;

    // Qurani.ai audio CDN (full-surah and verse-by-verse audio files)
    if (
      url.hostname === 'quranhub.b-cdn.net' &&
      (url.pathname.startsWith('/quran/audio/surah/') ||
        url.pathname.startsWith('/quran/audio/versebyverse/')) &&
      /\.mp3$/i.test(url.pathname)
    ) {
      return true;
    }

    // Quran Foundation audio CDN
    return url.hostname.endsWith('quranicaudio.com');
  },
  handler: {
    handle: async (options: HandlerCallbackOptions) => {
      const offlineCache = await caches.open(OFFLINE_CACHE);
      const offlineHit = await offlineCache.match(options.request);
      if (offlineHit) return offlineHit;

      return audioCacheFirst.handle(options);
    },
  },
};

// Reciters catalog: serve from cache immediately, revalidate in background.
// 30-day TTL keeps catalog usable offline for extended periods.
const apiRecitersCache = {
  matcher: ({ url }: { url: URL }) => url.pathname.startsWith('/api/reciters'),
  handler: new NetworkFirst({
    cacheName: 'api-reciters',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
};

// Cache the CSS, JavaScript, fonts, and images requested by the app shell.
// The offline document is stored separately, so its subresources need an
// explicit runtime strategy as well.
const appAssetsCache = {
  matcher: ({ url }: { url: URL }) =>
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/_next/image') ||
      url.pathname.startsWith('/images/')),
  handler: new NetworkFirst({
    cacheName: 'app-assets',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
};

const runtimeCaching = [
  quranAudioCache,
  apiRecitersCache,
  appAssetsCache,
  ...defaultCache,
];

// App shell URLs to pre-cache on install for offline cold-start support.
// Cached into 'pages' — the same cache Serwist's defaultCache navigation
// handler (NetworkFirst) checks when offline.
const APP_SHELL_URLS = ['/', '/offline', '/about', '/settings'];

const isAppAssetUrl = (url: URL) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/favicon.ico');

async function cacheOfflinePageAssets(response: Response) {
  const html = await response.clone().text();
  const assetUrls = new Set<string>(['/favicon.ico']);
  const assetPattern = /(?:src|href)=["']([^"']+)["']/g;

  for (const match of html.matchAll(assetPattern)) {
    try {
      const assetUrl = new URL(match[1], self.location.origin);
      if (isAppAssetUrl(assetUrl)) assetUrls.add(assetUrl.href);
    } catch {
      // Ignore malformed or external HTML references.
    }
  }

  const assetsCache = await caches.open('app-assets');
  await Promise.allSettled(
    [...assetUrls].map(async (assetUrl) => {
      const assetResponse = await fetch(assetUrl, {
        credentials: 'same-origin',
        cache: 'reload',
      });
      if (assetResponse.ok) {
        await assetsCache.put(assetUrl, assetResponse);
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const pagesCache = await caches.open('pages');
      await Promise.allSettled(
        APP_SHELL_URLS.map(async (url) => {
          const response = await fetch(url, {
            credentials: 'same-origin',
            cache: 'reload',
          });
          if (!response.ok) return;

          if (url === '/offline') await cacheOfflinePageAssets(response);
          await pagesCache.put(url, response);
        })
      );
      const apiCache = await caches.open('api-reciters');
      await Promise.allSettled([
        fetch('/api/reciters?language=ar').then((response) =>
          response.ok
            ? apiCache.put('/api/reciters?language=ar', response)
            : undefined
        ),
        fetch('/api/reciters?language=eng').then((response) =>
          response.ok
            ? apiCache.put('/api/reciters?language=eng', response)
            : undefined
        ),
      ]);
    })()
  );
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching,
});

// Navigation must never fall back to the last requested document. When the
// network fails, always show the cached offline page instead.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    (async () => {
      try {
        const request = new Request(event.request, { cache: 'no-store' });
        const response = await fetch(request);
        if (response.ok) return response;
      } catch {
        const requestUrl = new URL(event.request.url);
        if (requestUrl.pathname !== '/offline') {
          return Response.redirect(new URL('/offline', requestUrl), 302);
        }
      }

      const pagesCache = await caches.open('pages');
      const fallback = await pagesCache.match('/offline');
      return fallback ?? Response.error();
    })()
  );
});

serwist.setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    const pagesCache = await caches.open('pages');
    const fallback = await pagesCache.match('/offline');
    if (fallback) return fallback;

    console.error('[SW] Fallback failed: /offline not found in pages cache');
  }
  return Response.error();
});

serwist.addEventListeners();
