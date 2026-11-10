'use client';

import React, { useEffect, useState } from 'react';
import { MdCloudDone, MdCloudOff } from 'react-icons/md';

import ThemePicker from '@/components/theme-picker';
import Row from '@/components/ui/row';
import Segmented from '@/components/ui/segmented';
import Switch from '@/components/ui/switch';
import Tag from '@/components/ui/tag';
import { cn } from '@/utils';

const COLOUR_GROUPS: {
  title: string;
  tokens: { name: string; value: string; note?: string }[];
}[] = [
  {
    title: 'Canvas & surfaces',
    tokens: [
      { name: 'background', value: 'var(--background)' },
      { name: 'surface', value: 'var(--surface)' },
      { name: 'surface-raised', value: 'var(--surface-raised)' },
      { name: 'surface-sunken', value: 'var(--surface-sunken)' },
    ],
  },
  {
    title: 'Text',
    tokens: [
      { name: 'foreground', value: 'var(--foreground)' },
      { name: 'muted', value: 'var(--muted)' },
      { name: 'foreground-subtle', value: 'var(--foreground-subtle)' },
    ],
  },
  {
    title: 'Lines & action',
    tokens: [
      { name: 'border', value: 'var(--border)' },
      { name: 'border-strong', value: 'var(--border-strong)' },
      { name: 'accent / primary', value: 'var(--accent)' },
      { name: 'primary-soft', value: 'var(--accent-soft)' },
      { name: 'mark', value: 'var(--mark)' },
    ],
  },
  {
    title: 'Status',
    tokens: [
      { name: 'success', value: 'var(--success)' },
      { name: 'warning', value: 'var(--warning)' },
      { name: 'danger', value: 'var(--danger)' },
    ],
  },
];

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div>
        <h2 className="text-[18px] font-bold text-ink">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function TagGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[11px] font-bold text-ink-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export default function DesignPreview() {
  const [scope, setScope] = useState<'all' | 'recent' | 'favorites'>('all');
  const [downloaded, setDownloaded] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // This is a full-page harness; the app shell footer would float over it.
  useEffect(() => {
    document.body.dataset.preview = 'true';
    return () => {
      delete document.body.dataset.preview;
    };
  }, []);

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
        <header className="space-y-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-primary">
            Phase 0 · Foundations
          </p>
          <h1 className="text-[28px] font-black leading-tight">
            Design tokens
          </h1>
          <p className="text-[13px] text-ink-muted">
            Three palettes × two modes. Palette and mode are independent axes;
            the classic palette keeps the existing identity.
          </p>
        </header>

        <ThemePicker />

        <Section
          title="Palette"
          subtitle="Every component reads these roles, never a raw hex."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {COLOUR_GROUPS.map((group) => (
              <div
                key={group.title}
                className="rounded-card border border-border bg-surface p-3"
              >
                <h3 className="mb-2 text-[12px] font-bold text-ink-muted">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.tokens.map((token) => (
                    <li key={token.name} className="flex items-center gap-2">
                      <span
                        className="size-6 shrink-0 rounded-[6px] border border-border"
                        style={{ backgroundColor: token.value }}
                      />
                      <span className="truncate text-[12px] font-bold text-ink">
                        {token.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Type scale"
          subtitle="Tajawal 400/700/900 only. Quran text uses a scripture face."
        >
          <div className="space-y-3 rounded-card border border-border bg-surface p-4">
            <p className="text-[28px] font-black leading-tight">
              بِسْمِ اللَّهِ
            </p>
            <p className="text-[24px] font-bold">Select a reciter</p>
            <p className="text-[18px] font-bold">Al-Fatihah</p>
            <p className="text-[15px] font-bold">Mishary Rashid Alafasy</p>
            <p className="text-[15px] leading-7">
              Body text at 15px with 1.7 line height for Arabic paragraphs.
            </p>
            <p className="text-[13px] text-ink-muted">
              Metadata · Murattal · mp3quran
            </p>
            <p className="text-[12px] tabular-nums text-ink-muted">
              12 of 114 saved · 03:24 / 08:10
            </p>
          </div>
        </Section>

        <Section
          title="Tags"
          subtitle="Squarer, roomier, and grouped when several roles share a surface."
        >
          <div
            data-shot="tags"
            className="space-y-3 rounded-card border border-border bg-surface p-4"
          >
            <TagGroup label="Compact toggle">
              <Tag variant="filter" selected>
                All
              </Tag>
              <Tag variant="filter">Recent</Tag>
              <Tag variant="filter">Favourites</Tag>
              <Tag variant="filter" disabled>
                Downloaded
              </Tag>
            </TagGroup>

            <TagGroup label="Label" className="border-t border-border pt-3">
              <Tag variant="static" size="xs">
                mp3quran
              </Tag>
              <Tag variant="static" size="xs">
                Hafs
              </Tag>
              <Tag variant="static" size="sm">
                114 surahs
              </Tag>
            </TagGroup>

            <TagGroup
              label="Status & count"
              className="border-t border-border pt-3"
            >
              <Tag
                variant="status"
                size="sm"
                tone="success"
                icon={<MdCloudDone />}
              >
                Saved
              </Tag>
              <Tag
                variant="status"
                size="sm"
                tone="warning"
                icon={<MdCloudOff />}
              >
                Offline
              </Tag>
              <Tag variant="status" size="sm" tone="danger">
                Failed
              </Tag>
              <Tag variant="count">1,240 plays</Tag>
            </TagGroup>
          </div>
        </Section>

        <Section title="Controls">
          <div className="divide-y divide-border rounded-card border border-border bg-surface">
            <div className="flex flex-wrap gap-2 p-4">
              <button
                type="button"
                className="flex h-11 items-center rounded-[10px] bg-primary px-5 text-[15px] font-bold text-on-primary transition-colors duration-120 hover:bg-primary-hover"
              >
                Primary
              </button>
              <button
                type="button"
                className="flex h-11 items-center rounded-[10px] border border-border bg-surface px-5 text-[15px] font-bold text-ink transition-colors duration-120 hover:bg-surface-sunken"
              >
                Secondary
              </button>
              <button
                type="button"
                className="flex h-11 items-center px-2 text-[13px] font-bold text-primary"
              >
                Text action
              </button>
              <button
                type="button"
                className="flex h-11 items-center px-2 text-[13px] font-bold text-danger"
              >
                Destructive
              </button>
            </div>
            <div className="p-4">
              <Segmented
                value={scope}
                onChange={setScope}
                label="Scope"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'recent', label: 'Recent' },
                  { value: 'favorites', label: 'Favourites' },
                ]}
              />
            </div>
            <Row
              label="Downloaded only"
              description="Filters supported by the current palette."
            >
              <Switch
                checked={downloaded}
                onCheckedChange={setDownloaded}
                label="Downloaded only"
              />
            </Row>
            <Row
              label="Offline mode"
              description="Uses the warning tone only while forced."
            >
              <Switch
                checked={offlineMode}
                onCheckedChange={setOfflineMode}
                label="Offline mode"
              />
            </Row>
          </div>
        </Section>

        <Section
          title="Surfaces"
          subtitle="Flat by default. One border, at most one surface step."
        >
          <div className="flex flex-col gap-3 rounded-card bg-surface-sunken p-4">
            <div className="rounded-row border border-border bg-surface p-4">
              <p className="text-[15px] font-bold">Card on sunken band</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                The only separation is a 1px border.
              </p>
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-row border border-primary-line bg-primary-soft px-3 text-[13px] font-bold text-primary">
              Offline strip — forced mode
            </div>
          </div>
        </Section>

        <footer className="border-t border-border pt-4 text-[11px] text-ink-subtle">
          Phase 0 validation sheet · 3 palettes × 2 modes
        </footer>
      </div>
    </div>
  );
}
