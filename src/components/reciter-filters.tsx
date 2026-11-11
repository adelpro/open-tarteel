'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { MdClose, MdTune } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { LinkSource, Riwaya } from '@/types';
import { cn } from '@/utils';

import ProviderBadges from './provider-badge';
import Switch from './ui/switch';

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
  resultCount,
}: Props) {
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(false);
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
    (downloadableOnly ? 1 : 0);

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
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex h-10 items-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-[13px] font-bold text-ink transition-colors duration-120 hover:bg-surface-sunken"
      >
        <MdTune className="size-4 text-ink-muted" aria-hidden="true" />
        <span>
          {formatMessage({ id: 'filters.title', defaultMessage: 'Filters' })}
        </span>
        {activeCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] tabular-nums text-on-primary">
            {activeCount}
          </span>
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
        className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-[520px] rounded-t-[20px] border-t border-border bg-surface p-0 text-ink backdrop:bg-zinc-900/50 lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[80dvh] lg:max-w-md lg:rounded-card lg:border"
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <h2 id={titleId} className="text-[16px] font-bold">
            {formatMessage({ id: 'filters.title', defaultMessage: 'Filters' })}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="-me-2 flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-ink"
            aria-label={formatMessage({
              id: 'common.close',
              defaultMessage: 'Close',
            })}
          >
            <MdClose className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[60dvh] overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-2 lg:max-h-[calc(80dvh-7rem)]">
          <FilterSection
            title={formatMessage({
              id: 'filters.sources',
              defaultMessage: 'Source',
            })}
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
          </FilterSection>

          <FilterSection
            title={formatMessage({
              id: 'filters.riwayat',
              defaultMessage: 'Riwaya',
            })}
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
          </FilterSection>

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
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={clearAll}
            disabled={activeCount === 0}
            className="h-11 px-2 text-[13px] font-bold text-ink-muted transition-colors duration-120 hover:text-ink disabled:opacity-40"
          >
            {formatMessage({
              id: 'filters.clear',
              defaultMessage: 'Clear all',
            })}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-11 items-center rounded-[10px] bg-primary px-5 text-[14px] font-bold text-on-primary transition-colors duration-120 hover:bg-primary-hover"
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

function FilterSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('px-2', className)}>
      <h3 className="px-2 pb-1 pt-2 text-[12px] font-bold text-ink-muted">
        {title}
      </h3>
      <ul>{children}</ul>
    </section>
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
          className="size-4 shrink-0 rounded border-border-strong text-primary focus:ring-primary"
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
