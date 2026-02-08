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
  compiler: {
    removeConsole: isProduction && { exclude: ['error'] },
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
  webpack: (config, { isServer, webpack }) => {
    // Gun.js imports server-side modules that shouldn't be bundled in the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        'aws-sdk': false,
      };

      // Ignore Gun.js server-side modules to suppress warnings
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^aws-sdk$/,
          contextRegExp: /gun/,
        })
      );
    }

    // Suppress warnings for Gun.js server imports
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/gun\/lib\/rs3\.js/,
        message: /Can't resolve 'aws-sdk'/,
      },
    ];

    return config;
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
