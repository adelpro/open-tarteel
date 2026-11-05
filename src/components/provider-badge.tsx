'use client';

import React from 'react';
import { FiAlertTriangle, FiDownload, FiType } from 'react-icons/fi';
import { MdGraphicEq } from 'react-icons/md';
import { useIntl } from 'react-intl';

import {
  getCapabilities,
  type ProviderCapabilities,
} from '@/services/reciters/capabilities';
import { LinkSource } from '@/types';
import { cn } from '@/utils';

import Tooltip from './tooltip';

export type ProviderBadge = {
  key: string;
  messageId: string;
  defaultMessage: string;
  icon: React.ReactNode;
  className: string;
};

const badge = (
  key: string,
  messageId: string,
  defaultMessage: string,
  icon: React.ReactNode,
  className: string
): ProviderBadge => ({ key, messageId, defaultMessage, icon, className });

const BETA = () =>
  badge(
    'beta',
    'provider.badge.beta',
    'Beta',
    <FiAlertTriangle size={11} aria-hidden="true" />,
    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
  );

const TIMING = () =>
  badge(
    'timing',
    'provider.badge.timing',
    'Timing',
    <MdGraphicEq size={12} aria-hidden="true" />,
    'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
  );

const WORD = () =>
  badge(
    'word',
    'provider.badge.word',
    'Word-by-word',
    <FiType size={11} aria-hidden="true" />,
    'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
  );

const NO_DOWNLOAD = () =>
  badge(
    'no-download',
    'provider.badge.noDownload',
    'No download',
    <FiDownload size={11} aria-hidden="true" />,
    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  );

/** Ordered by importance; the UI shows the first two. */
export const getProviderBadges = (
  capabilities: ProviderCapabilities
): ProviderBadge[] => {
  const badges: ProviderBadge[] = [];

  if (capabilities.beta) badges.push(BETA());
  if (capabilities.timing !== 'none') badges.push(TIMING());
  if (
    capabilities.timing === 'word' ||
    capabilities.timing === 'letter' ||
    capabilities.timing === 'phoneme' ||
    capabilities.wordAudio
  ) {
    badges.push(WORD());
  }
  if (!capabilities.download) badges.push(NO_DOWNLOAD());

  return badges;
};

type Props = {
  source: LinkSource;
  max?: number;
  className?: string;
};

export default function ProviderBadges({ source, max = 2, className }: Props) {
  const intl = useIntl();
  const capabilities = getCapabilities(source);
  const badges = getProviderBadges(capabilities);

  if (badges.length === 0) return null;

  const visible = badges.slice(0, max);
  const hidden = badges.slice(max);
  const tooltip = badges
    .map((item) =>
      intl.formatMessage({
        id: item.messageId,
        defaultMessage: item.defaultMessage,
      })
    )
    .join(' · ');

  return (
    <Tooltip content={tooltip} className={cn('inline-flex', className)}>
      <span
        className="inline-flex flex-wrap items-center gap-1"
        title={tooltip}
        aria-label={tooltip}
      >
        {visible.map((item) => (
          <span
            key={item.key}
            className={cn(
              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none',
              item.className
            )}
          >
            <span className="flex h-3 w-3 shrink-0 items-center justify-center">
              {item.icon}
            </span>
            {intl.formatMessage({
              id: item.messageId,
              defaultMessage: item.defaultMessage,
            })}
          </span>
        ))}
        {hidden.length > 0 && (
          <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {intl.formatMessage(
              { id: 'provider.badge.more' },
              { count: hidden.length }
            )}
          </span>
        )}
      </span>
    </Tooltip>
  );
}
