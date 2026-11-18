import { Tajawal } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { EnabledSourcesCookieSync } from '@/components/enabled-sources-cookie-sync';
import FullscreenController from '@/components/fullscreen-controller';
import HtmlWrapper from '@/components/html-wrapper';
import IntlProviderWrapper from '@/components/intl-provider-wrapper';
import OfflineRedirect from '@/components/offline-redirect';
import PwaUpdater from '@/components/pwa-updater';
import ReciterRouteCookie from '@/components/reciter-route-cookie';
import { ServiceWorkerRefresh } from '@/components/service-worker-refresh';
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
            suppressHydrationWarning
            className={`${tajawal.className} min-h-full bg-background antialiased`}
          >
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink focus:shadow-lg"
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
              tabIndex={-1}
              className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-background pb-20 text-foreground"
            >
              <EnabledSourcesCookieSync />
              <ReciterRouteCookie />
              <StoragePersist />
              <OfflineRedirect />
              {process.env.NEXT_PUBLIC_IS_PREVIEW === 'true' ? (
                <ServiceWorkerRefresh />
              ) : (
                <PwaUpdater />
              )}
              <FullscreenController>{children}</FullscreenController>
            </main>
          </body>
        </HtmlWrapper>
      </IntlProviderWrapper>
    </NuqsAdapter>
  );
}
