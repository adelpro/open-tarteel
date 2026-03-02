import withBundleAnalyzer from '@next/bundle-analyzer';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
const isDebug = process.env.DEBUG === 'true';
const isDebugSW = process.env.NEXT_PUBLIC_DEBUG_SW === 'true';

const isDebugMode = isDebug || isDebugSW;
const removeConsole =
  isProduction && !isDebugMode ? { exclude: ['error'] } : undefined;

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: false,
  disable: !(isProduction || isDebugSW),
  register: isProduction || isDebugSW,
  maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 100MB
});

const nextConfig: NextConfig = {
  reactStrictMode: !isProduction,
  poweredByHeader: !isProduction,
  transpilePackages: ['jotai-devtools'],
  productionBrowserSourceMaps: isProduction,
  compiler: {
    removeConsole,
  },
  typescript: {
    ignoreBuildErrors: !isProduction,
  },
  eslint: {
    ignoreDuringBuilds: !isProduction,
  },
  experimental: {
    // nextScriptWorkers: true,
  },

  async rewrites() {
    return [
      {
        source: '/',
        destination: '/ar',
      },
    ];
  },
};

// Wrap your Next.js config with serwist.
const configWithPWA = withSerwist(nextConfig);

/* How this will work

* Bundle-analyzer will run only if we pass 'ANALYZER=true' to our command (yarn analyze)
*
* next-PWA is disabled in developement ( disable: process.env.NODE_ENV === 'development', )
* next-PWA will run only with this command ( yarn build)
*
* running (yarn dev) will only pass the (config)
*/

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(configWithPWA);
