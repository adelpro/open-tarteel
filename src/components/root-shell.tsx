import { Tajawal } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { EnabledSourcesCookieSync } from '@/components/enabled-sources-cookie-sync';
import FullscreenController from '@/components/fullscreen-controller';
import HtmlWrapper from '@/components/html-wrapper';
import IntlProviderWrapper from '@/components/intl-provider-wrapper';
import OfflineRedirect from '@/components/offline-redirect';
import PwaUpdater from '@/components/pwa-updater';
import ReciterRouteCookie from '@/components/reciter-route-cookie';
import StoragePersist from '@/components/storage-persist';
import { websiteGraph } from '@/lib/seo/json-ld';
import type { SeoLocale } from '@/lib/seo/routes';

const tajawal = Tajawal({
  weight: ['400', '700', '900'],
  subsets: ['arabic'],
  preload: true,
});

/**
 * The document shell shared by the three locale root layouts.
 *
 * The locale is a route-group constant, so this tree has no request-dependent
 * API and each page can be prerendered.
 */
export function RootShell({
  locale,
  children,
}: {
  locale: SeoLocale;
  children: React.ReactNode;
}) {
  return (
    <NuqsAdapter>
      <IntlProviderWrapper initialLocale={locale}>
        <HtmlWrapper>
          <body
            className={`${tajawal.className} min-h-full bg-background antialiased`}
          >
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg dark:focus:bg-gray-800 dark:focus:text-gray-100"
            >
              Skip to content / تخطَّ إلى المحتوى
            </a>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(websiteGraph({ locale })).replace(
                  /</g,
                  '\\u003c'
                ),
              }}
            />
            <main
              id="main-content"
              className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-background pb-20 text-foreground"
            >
              <div className="ambient-orbs pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-[10%] -top-[15%] h-[520px] w-[520px] rounded-full bg-sky-500/[0.06] blur-[80px] dark:bg-sky-400/[0.07]" />
                <div className="absolute -right-[8%] top-[25%] h-[420px] w-[420px] rounded-full bg-indigo-500/[0.05] blur-[80px] dark:bg-indigo-400/[0.07]" />
                <div className="absolute bottom-[-10%] left-[35%] h-[340px] w-[340px] rounded-full bg-violet-500/[0.04] blur-[70px] dark:bg-violet-400/[0.06]" />
              </div>
              <EnabledSourcesCookieSync />
              <ReciterRouteCookie />
              <StoragePersist />
              <OfflineRedirect />
              {process.env.NEXT_PUBLIC_IS_PREVIEW !== 'true' && <PwaUpdater />}
              <FullscreenController>{children}</FullscreenController>
            </main>
          </body>
        </HtmlWrapper>
      </IntlProviderWrapper>
    </NuqsAdapter>
  );
}
