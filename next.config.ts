// next.config.mjs
import withBundleAnalyzer from '@next/bundle-analyzer';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  disable: !isProduction,
  register: isProduction,
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 100MB
});

const nextConfig: NextConfig = {
  reactStrictMode: !isProduction,
  poweredByHeader: !isProduction,
  transpilePackages: ['jotai-devtools'],
  productionBrowserSourceMaps: isProduction,
  allowedDevOrigins: ['localhost'],
  compiler: {
    removeConsole: isProduction && { exclude: ['error'] },
  },
  experimental: {
    reactCompiler: true,
  },
  typescript: {
    ignoreBuildErrors: !isProduction,
  },
  eslint: {
    ignoreDuringBuilds: !isProduction,
  },
};

// Wrap your Next.js config with serwist.
const configWithPWA = withSerwist(nextConfig);

/* How this will work

* Bundle-analyzer will run only if we pass 'ANALYZER=true' to our command (yarn analyze)
*
* next-PWA is disabled in developement ( disable: process.env.NODE_ENV === 'development', )
* next-PWA runs in production; development keeps HMR and chunk loading network-only.
*
* running (yarn dev) will only pass the (config)
*/

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(configWithPWA);
