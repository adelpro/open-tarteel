// next.config.mjs
import withBundleAnalyzer from '@next/bundle-analyzer';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
const buildAppUrl =
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

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  disable: !isProduction,
  register: isProduction,
  // Only build assets are precached; keep the limit small so a stray large
  // file cannot inflate the service worker install.
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
});

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
  env: buildAppUrl ? { NEXT_PUBLIC_APP_URL: buildAppUrl } : {},
  poweredByHeader: false,
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
