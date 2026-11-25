'use client';

import { useAtom } from 'jotai';
import React, { useEffect, useId, useRef, useState } from 'react';
import { MdClose, MdExpandMore, MdTune } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { filtersRiwayatOpenAtom, filtersSourcesOpenAtom } from '@/jotai/atom';
import { LinkSource, Riwaya } from '@/types';
import { cn } from '@/utils';

import ProviderBadges from './provider-badge';
import Switch from './ui/switch';
import Tag from './ui/tag';

type Option = { value: string; label: string };

type Props = {
  availableSources: Option[];
  availableRiwiyat: Option[];
  selectedSources: LinkSource[];
  selectedRiwiyat: Riwaya[];
  onSourcesChange: (sources: LinkSource[]) => void;
  onRiwiyatChange: (riwayat: Riwaya[]) => void;
  downloadableOnly: boolean;
  onDownloadableOnlyChange: (value: boolean) => void;
  followAlongOnly: boolean;
  onFollowAlongOnlyChange: (value: boolean) => void;
  resultCount: number;
};

/**
 * One disclosure instead of two rows of filter chips. The sheet holds grouped
 * multi-select lists, so the reciter list itself stays scannable.
 */
export default function ReciterFilters({
  availableSources,
  availableRiwiyat,
  selectedSources,
  selectedRiwiyat,
  onSourcesChange,
  onRiwiyatChange,
  downloadableOnly,
  onDownloadableOnlyChange,
  followAlongOnly,
  onFollowAlongOnlyChange,
  resultCount,
}: Props) {
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useAtom(filtersSourcesOpenAtom);
  const [riwayatOpen, setRiwayatOpen] = useAtom(filtersRiwayatOpenAtom);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const activeCount =
    selectedSources.length +
    selectedRiwiyat.length +
    (downloadableOnly ? 1 : 0) +
    (followAlongOnly ? 1 : 0);

  const toggleSource = (source: LinkSource) => {
    onSourcesChange(
      selectedSources.includes(source)
        ? selectedSources.filter((value) => value !== source)
        : [...selectedSources, source]
    );
  };

  const clearAll = () => {
    onSourcesChange([]);
    onRiwiyatChange([]);
    onDownloadableOnlyChange(false);
    onFollowAlongOnlyChange(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="focus-ring flex h-11 items-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-[13px] font-bold text-ink transition-colors duration-120 hover:bg-surface-sunken"
      >
        <MdTune className="size-4 text-ink-muted" aria-hidden="true" />
        <span className="text-ink-muted">
          {formatMessage({ id: 'filters.title', defaultMessage: 'Filters' })}
        </span>
        {activeCount > 0 ? (
          <Tag variant="status" tone="primary" size="xs">
            {activeCount}
          </Tag>
        ) : null}
      </button>

      <dialog
        ref={dialogRef}
        {...({ closedby: 'any' } as const)}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-[520px] rounded-t-[20px] border-t border-border bg-surface p-0 text-ink backdrop:bg-scrim lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[80dvh] lg:max-w-md lg:rounded-card lg:border"
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <h2 id={titleId} className="text-[16px] font-bold">
            {formatMessage({ id: 'filters.title', defaultMessage: 'Filters' })}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="focus-ring -me-2 flex size-11 items-center justify-center rounded-control text-ink-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-ink"
            aria-label={formatMessage({
              id: 'common.close',
              defaultMessage: 'Close',
            })}
          >
            <MdClose className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[60dvh] overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-2 lg:max-h-[calc(80dvh-7rem)]">
          <FilterAccordion
            title={formatMessage({
              id: 'filters.sources',
              defaultMessage: 'Source',
            })}
            open={sourcesOpen}
            onOpenChange={setSourcesOpen}
          >
            {availableSources.map((source) => (
              <CheckRow
                key={source.value}
                checked={selectedSources.includes(source.value as LinkSource)}
                onChange={() => toggleSource(source.value as LinkSource)}
                label={source.label}
                description={
                  <ProviderBadges
                    source={source.value as LinkSource}
                    max={2}
                    plain
                  />
                }
              />
            ))}
          </FilterAccordion>

          <FilterAccordion
            title={formatMessage({
              id: 'filters.riwayat',
              defaultMessage: 'Riwaya',
            })}
            open={riwayatOpen}
            onOpenChange={setRiwayatOpen}
            className="mt-2 border-t border-border pt-3"
          >
            {availableRiwiyat.map((riwaya) => (
              <CheckRow
                key={riwaya.value}
                checked={selectedRiwiyat.includes(riwaya.value as Riwaya)}
                onChange={() =>
                  onRiwiyatChange(
                    selectedRiwiyat.includes(riwaya.value as Riwaya)
                      ? selectedRiwiyat.filter(
                          (value) => value !== (riwaya.value as Riwaya)
                        )
                      : [...selectedRiwiyat, riwaya.value as Riwaya]
                  )
                }
                label={riwaya.label}
              />
            ))}
          </FilterAccordion>

          <div className="mt-2 flex min-h-12 items-center justify-between gap-4 border-t border-border px-2 pt-3">
            <div>
              <p className="text-[14px] font-bold text-ink">
                {formatMessage({
                  id: 'filter.downloadable',
                  defaultMessage: 'Downloadable',
                })}
              </p>
              <p className="text-[12px] text-ink-muted">
                {formatMessage({
                  id: 'filters.downloadableHint',
                  defaultMessage: 'Only sources that allow offline downloads.',
                })}
              </p>
            </div>
            <Switch
              checked={downloadableOnly}
              onCheckedChange={onDownloadableOnlyChange}
              label={formatMessage({
                id: 'filter.downloadable',
                defaultMessage: 'Downloadable',
              })}
            />
          </div>

          <div className="mt-2 flex min-h-12 items-center justify-between gap-4 border-t border-border px-2 pt-3">
            <div>
              <p className="text-[14px] font-bold text-ink">
                {formatMessage({
                  id: 'filter.followAlong',
                  defaultMessage: 'Follow-along',
                })}
              </p>
              <p className="text-[12px] text-ink-muted">
                {formatMessage({
                  id: 'filters.followAlongHint',
                  defaultMessage: 'Only recitations with word-level timings.',
                })}
              </p>
            </div>
            <Switch
              checked={followAlongOnly}
              onCheckedChange={onFollowAlongOnlyChange}
              label={formatMessage({
                id: 'filter.followAlong',
                defaultMessage: 'Follow-along',
              })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={clearAll}
            disabled={activeCount === 0}
            className="focus-ring h-11 px-2 text-[13px] font-bold text-ink-muted transition-colors duration-120 hover:text-ink disabled:opacity-40"
          >
            {formatMessage({
              id: 'filters.clear',
              defaultMessage: 'Clear all',
            })}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="focus-ring flex h-11 items-center rounded-[10px] bg-primary px-5 text-[14px] font-bold text-on-primary transition-colors duration-120 hover:bg-primary-hover"
          >
            {formatMessage(
              {
                id: 'filters.showResults',
                defaultMessage: 'Show {count} reciters',
              },
              { count: resultCount }
            )}
          </button>
        </div>
      </dialog>
    </>
  );
}

function FilterAccordion({
  title,
  open,
  onOpenChange,
  children,
  className,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      className={cn('group px-2', className)}
    >
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-1.5 rounded-[8px] px-2 py-2 text-xs font-bold text-ink-muted transition-colors duration-120 hover:bg-surface-sunken [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <MdExpandMore
          className="size-4 shrink-0 transition-transform duration-120 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="divide-y divide-border">{children}</ul>
    </details>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: React.ReactNode;
}) {
  return (
    <li>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[8px] px-2 py-1.5 hover:bg-surface-sunken">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="focus-ring size-4 shrink-0 rounded border-border-strong text-primary"
        />
        <span className="min-w-0">
          <span className="block truncate text-[14px] text-ink">{label}</span>
          {description ? (
            <span className="mt-0.5 block">{description}</span>
          ) : null}
        </span>
      </label>
    </li>
  );
}
