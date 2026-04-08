'use client';

import { useAtom } from 'jotai';
import { FormattedMessage } from 'react-intl';

import CacheManagement from '@/components/cache-management';
import useDirection from '@/hooks/use-direction';
import { enabledSourcesAtom } from '@/jotai/atom';
import { LinkSource } from '@/types';

const AVAILABLE_SOURCES: { source: LinkSource; id: string }[] = [
  { source: LinkSource.MP3QURAN, id: 'settings.source.mp3quran' },
  { source: LinkSource.ITQAN, id: 'settings.source.itqan' },
];

export default function SettingsPage() {
  const { isRTL } = useDirection();
  const [enabledSources, setEnabledSources] = useAtom(enabledSourcesAtom);

  const toggleSource = (source: LinkSource) => {
    setEnabledSources((previous) => {
      if (previous.includes(source)) {
        if (previous.length <= 1) return previous;
        return previous.filter((s) => s !== source);
      }
      return [...previous, source];
    });
  };

  const selectAll = () => {
    setEnabledSources(AVAILABLE_SOURCES.map(({ source }) => source));
  };

  return (
    <div className="mt-10 flex w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">
          <FormattedMessage id="settings.title" defaultMessage="Settings" />
        </h1>

        <section
          className="m-1 space-y-4 rounded p-4 text-start md:m-2 md:border md:border-gray-200 md:bg-white md:p-8 md:shadow-sm md:dark:border-gray-600 md:dark:bg-gray-800"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-300">
            <FormattedMessage
              id="settings.reciterSources"
              defaultMessage="Reciter sources"
            />
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            <FormattedMessage
              id="settings.reciterSourcesDescription"
              defaultMessage="Choose which sources to show in the reciter list. At least one must be enabled."
            />
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-gray-300 bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-100 transition-colors hover:bg-gray-600"
            >
              <FormattedMessage
                id="settings.selectAll"
                defaultMessage="Select all"
              />
            </button>
          </div>
          <ul className="space-y-3">
            {AVAILABLE_SOURCES.map(({ source, id }) => {
              const isChecked = enabledSources.includes(source);
              return (
                <li key={source} className="flex items-center gap-3">
                  <input
                    id={`source-${source}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSource(source)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-CTA-blue-600 focus:ring-brand-CTA-blue-500 dark:border-gray-500 dark:bg-gray-700 dark:checked:border-brand-CTA-blue-500 dark:checked:bg-brand-CTA-blue-600"
                    aria-describedby={`source-desc-${source}`}
                  />
                  <label
                    htmlFor={`source-${source}`}
                    className="cursor-pointer text-gray-900 dark:text-gray-100"
                    id={`source-desc-${source}`}
                  >
                    <FormattedMessage id={id} defaultMessage={source} />
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Offline downloads / cache management ── */}
        <section
          className="m-1 space-y-4 rounded p-4 text-start md:m-2 md:border md:border-gray-200 md:bg-white md:p-8 md:shadow-sm md:dark:border-gray-600 md:dark:bg-gray-800"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-300">
            <FormattedMessage
              id="settings.cacheManagement"
              defaultMessage="Offline downloads"
            />
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            <FormattedMessage
              id="settings.cacheManagementDescription"
              defaultMessage="Manage downloaded recitations stored on your device."
            />
          </p>
          <CacheManagement />
        </section>
      </div>
    </div>
  );
}
