'use client';

import React, { useEffect, useState } from 'react';
import { BsCircleHalf, BsMoonStarsFill, BsSunFill } from 'react-icons/bs';
import { useIntl } from 'react-intl';

import { useTheme } from '@/hooks/use-theme';
import { type Palette, type Theme } from '@/jotai/atom';
import { cn } from '@/utils';

import Segmented from './ui/segmented';

type PaletteOption = {
  value: Palette;
  label: string;
  description: string;
  swatches: [string, string, string];
};

const PALETTES: PaletteOption[] = [
  {
    value: 'warm',
    label: 'Warm',
    description: 'Paper, emerald, brass',
    swatches: ['#f6f2e9', '#0c6b53', '#8a6420'],
  },
  {
    value: 'classic',
    label: 'Classic',
    description: 'Sky blue on zinc',
    swatches: ['#f4f4f5', '#0ea5e9', '#18181b'],
  },
  {
    value: 'night',
    label: 'Night',
    description: 'Green-black and mint',
    swatches: ['#0a0d0c', '#6fe3b8', '#e3c27e'],
  },
];

/** Palette (colour family) and mode (light/dark) are two separate choices. */
export default function ThemePicker({ className }: { className?: string }) {
  const { palette, setPalette, mode, setMode } = useTheme();
  const { formatMessage } = useIntl();
  // The stored palette only exists on the client. Render the server defaults
  // first so hydration matches, then swap to the real values.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePalette = mounted ? palette : 'warm';
  const activeMode = mounted ? mode : 'system';

  const modes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: formatMessage({ id: 'theme.light', defaultMessage: 'Light' }),
      icon: <BsSunFill className="size-3.5" />,
    },
    {
      value: 'system',
      label: formatMessage({ id: 'theme.system', defaultMessage: 'System' }),
      icon: <BsCircleHalf className="size-3.5" />,
    },
    {
      value: 'dark',
      label: formatMessage({ id: 'theme.dark', defaultMessage: 'Dark' }),
      icon: <BsMoonStarsFill className="size-3.5" />,
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div
        role="radiogroup"
        aria-label={formatMessage({
          id: 'theme.palette',
          defaultMessage: 'Colour palette',
        })}
        className="grid grid-cols-3 gap-2"
      >
        {PALETTES.map((option) => {
          const active = option.value === activePalette;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPalette(option.value)}
              className={cn(
                'flex min-h-24 flex-col items-start justify-between gap-3 rounded-row border border-border bg-surface p-3 text-start transition-colors duration-120',
                active
                  ? 'border-primary ring-2 ring-primary'
                  : 'hover:bg-surface-sunken'
              )}
            >
              <span
                aria-hidden="true"
                className="flex w-full overflow-hidden rounded-full border border-border"
              >
                {option.swatches.map((color) => (
                  <span
                    key={color}
                    className="h-3 flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold leading-tight text-ink">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-tight text-ink-muted">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Segmented
        value={activeMode}
        onChange={setMode}
        options={modes}
        label={formatMessage({
          id: 'theme.mode',
          defaultMessage: 'Appearance mode',
        })}
      />
    </div>
  );
}
