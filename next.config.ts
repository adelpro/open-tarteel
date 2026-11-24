// next.config.mjs
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import withBundleAnalyzer from '@next/bundle-analyzer';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
// Netlify sets CONTEXT to "production", "deploy-preview" or "branch-deploy".
// Preview/branch deploys must use their own origin, even when the site has a
// canonical NEXT_PUBLIC_APP_URL configured for production.
const isNetlifyPreview =
  process.env.CONTEXT === 'deploy-preview' ||
  process.env.CONTEXT === 'branch-deploy';
const buildAppUrl =
  (isNetlifyPreview ? process.env.DEPLOY_PRIME_URL : undefined) ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_TARTEEL_APP_URL ||
  // Netlify sets these at build time. DEPLOY_PRIME_URL is the primary URL for
  // the current deploy (branch deploy or deploy preview).
  process.env.DEPLOY_PRIME_URL ||
  process.env.URL;

if (
  isProduction &&
  (!buildAppUrl ||
    buildAppUrl.includes('localhost') ||
    buildAppUrl.includes('127.0.0.1'))
) {
  console.warn(
    '\n[open-tarteel] NEXT_PUBLIC_APP_URL is missing or points to localhost. ' +
      'Metadata, sitemap, robots.txt and share links will be generated with ' +
      'the wrong origin. Set it before running `next build`.\n'
  );
}

// Serwist's default public-folder scan includes `_headers`, which Netlify
// serves but the Cloudflare Worker asset binding does not. A precache 404
// aborts the worker install, so build the manifest explicitly without it.
const publicDirectory = path.join(process.cwd(), 'public');
const listPublicFiles = (directory: string, prefix = ''): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      return listPublicFiles(path.join(directory, entry.name), relative);
    }
    return entry.isFile() ? [relative] : [];
  });

const precacheEntries = listPublicFiles(publicDirectory)
  .filter(
    (file) =>
      file !== '_headers' && file !== 'sw.js' && !file.startsWith('swe-worker-')
  )
  .map((file) => ({
    url: `/${file.split(path.sep).join('/')}`,
    revision: createHash('sha256')
      .update(readFileSync(path.join(publicDirectory, file)))
      .digest('hex'),
  }));

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  disable: !isProduction,
  // Registered explicitly in src/components/service-worker-register.tsx so the
  // Cloudflare/OpenNext build behaves the same as the standard Next build.
  register: false,
  // Only build assets are precached; keep the limit small so a stray large
  // file cannot inflate the service worker install.
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
  additionalPrecacheEntries: precacheEntries,
  // These exist in the Next/Netlify output but not in the Cloudflare Worker's
  // static assets. Serwist's precache install fails on a 404, which prevented
  // the worker from ever activating on the live deploy.
  exclude: [
    /\.map$/,
    /^manifest.*\.js$/,
    /_headers$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/,
  ],
});

const noindex = isNetlifyPreview || process.env.SEO_NOINDEX === 'true';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  ...(noindex ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
  ...(isProduction
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Netlify's OpenNext adapter builds its own server; `standalone` is only for
  // the Docker image. Keep Docker builds identical and let Netlify use its
  // default output.
  ...(process.env.NETLIFY ? {} : { output: 'standalone' as const }),
  reactStrictMode: !isProduction,
  // Inline the resolved origin so client code (share links, metadata) never
  // falls back to localhost on deploy previews.
  env: {
    ...(buildAppUrl ? { NEXT_PUBLIC_APP_URL: buildAppUrl } : {}),
    // Let deploy previews auto-activate the new worker so testers never get
    // stuck on a stale API cache. Production still waits for the user.
    NEXT_PUBLIC_IS_PREVIEW:
      process.env.NEXT_PUBLIC_IS_PREVIEW ??
      (isNetlifyPreview ? 'true' : 'false'),
    // Set for the Cloudflare test worker: no outbound WebSocket to Gun there.
    NEXT_PUBLIC_DISABLE_GUN: process.env.NEXT_PUBLIC_DISABLE_GUN ?? 'false',
  },
  poweredByHeader: false,
  // The Next dev tools badge docks bottom-left and covers the footer at 375px.
  // It is dev-only decoration, not part of the interface.
  devIndicators: false,
  productionBrowserSourceMaps: false,
  allowedDevOrigins: ['localhost'],
  compiler: {
    removeConsole: isProduction && { exclude: ['error'] },
  },
  experimental: {
    reactCompiler: true,
    cpus: 4,
  },
  typescript: {
    ignoreBuildErrors: !isProduction,
  },
  eslint: {
    ignoreDuringBuilds: !isProduction,
  },
  staticPageGenerationTimeout: 180,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // The service worker must never be served from the HTTP cache,
        // otherwise clients can get stuck on an old version.
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/api/send-feedback',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

// Wrap your Next.js config with serwist.
const configWithPWA = withSerwist(nextConfig);

/* How this will work

* Bundle-analyzer will run only if we pass 'ANALYZE=true' to our command (yarn analyze)

* next-PWA is disabled in developement ( disable: process.env.NODE_ENV === 'development', )
* next-PWA runs in production; development keeps HMR and chunk loading network-only.

* running (yarn dev) will only pass the (config)
*/

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(configWithPWA);
