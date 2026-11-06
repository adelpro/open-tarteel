'use client';

import { MdWarning } from 'react-icons/md';
import { useIntl } from 'react-intl';

import type { OfflineErrorCode } from '@/services/offline/types';

export default function DownloadError({ code }: { code: OfflineErrorCode }) {
  const { formatMessage } = useIntl();
  if (!code) return null;

  const message =
    code === 'quota'
      ? formatMessage({
          id: 'download.errorQuota',
          defaultMessage:
            'Not enough storage. Free up space or remove downloads, then try again.',
        })
      : code === 'network'
        ? formatMessage({
            id: 'download.errorNetwork',
            defaultMessage:
              'Download failed. Check your connection and try again.',
          })
        : formatMessage({
            id: 'download.errorUnknown',
            defaultMessage: 'Download failed. Try again.',
          });

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
    >
      <MdWarning size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
