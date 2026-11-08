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
import Tag, { type TagTone } from './ui/tag';

export type ProviderBadge = {
  key: string;
  messageId: string;
  defaultMessage: string;
  icon: React.ReactNode;
  tone: TagTone;
};

const badge = (
  key: string,
  messageId: string,
  defaultMessage: string,
  icon: React.ReactNode,
  tone: TagTone
): ProviderBadge => ({ key, messageId, defaultMessage, icon, tone });

const BETA = () =>
  badge(
    'beta',
    'provider.badge.beta',
    'Beta',
    <FiAlertTriangle size={11} aria-hidden="true" />,
    'warning'
  );

const TIMING = () =>
  badge(
    'timing',
    'provider.badge.timing',
    'Timing',
    <MdGraphicEq size={12} aria-hidden="true" />,
    'primary'
  );

const WORD = () =>
  badge(
    'word',
    'provider.badge.word',
    'Word-by-word',
    <FiType size={11} aria-hidden="true" />,
    'primary'
  );

const NO_DOWNLOAD = () =>
  badge(
    'no-download',
    'provider.badge.noDownload',
    'No download',
    <FiDownload size={11} aria-hidden="true" />,
    'neutral'
  );

/** Ordered by importance; the UI shows the first three. */
export const getProviderBadges = (
  capabilities: ProviderCapabilities
): ProviderBadge[] => {
  const badges: ProviderBadge[] = [];

  if (capabilities.beta) badges.push(BETA());
  if (!capabilities.download) badges.push(NO_DOWNLOAD());
  if (capabilities.timing !== 'none') badges.push(TIMING());
  if (
    capabilities.timing === 'word' ||
    capabilities.timing === 'letter' ||
    capabilities.timing === 'phoneme' ||
    capabilities.wordAudio
  ) {
    badges.push(WORD());
  }

  return badges;
};

type Props = {
  source: LinkSource;
  max?: number;
  className?: string;
  /** Render a single muted line instead of tags (dense filter rows). */
  plain?: boolean;
};

export default function ProviderBadges({
  source,
  max = 3,
  className,
  plain = false,
}: Props) {
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

  if (plain) {
    return (
      <span
        className={cn('text-[11px] text-ink-muted', className)}
        title={tooltip}
      >
        {tooltip}
      </span>
    );
  }

  return (
    <Tooltip content={tooltip} className={cn('inline-flex', className)}>
      <span
        className="inline-flex flex-wrap items-center gap-1"
        title={tooltip}
        aria-label={tooltip}
      >
        {visible.map((item) => (
          <Tag
            key={item.key}
            variant="static"
            size="xs"
            tone={item.tone}
            icon={item.icon}
          >
            {intl.formatMessage({
              id: item.messageId,
              defaultMessage: item.defaultMessage,
            })}
          </Tag>
        ))}
        {hidden.length > 0 && (
          <Tag variant="static" size="xs">
            {intl.formatMessage(
              { id: 'provider.badge.more' },
              { count: hidden.length }
            )}
          </Tag>
        )}
      </span>
    </Tooltip>
  );
}
