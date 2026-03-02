'use client';

import { Check, Radio } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getMessageConfig as t } from '@/helpers';
import { cn } from '@/lib/utils';

type Source = {
  id: string;
  labelKey: string;
  enabled: boolean;
};

const DEFAULT_SOURCES: Source[] = [
  { id: 'mp3quran', labelKey: 'settings.sources.mp3quran', enabled: true },
  { id: 'itqan', labelKey: 'settings.sources.itqan', enabled: true },
];

export function SourcesSettings() {
  const { formatMessage } = useIntl();
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [warning, setWarning] = useState('');

  const enabledCount = sources.filter((s) => s.enabled).length;

  const toggleSource = (id: string) => {
    setSources((previous) => {
      const target = previous.find((s) => s.id === id);
      if (target?.enabled && enabledCount <= 1) {
        setWarning(formatMessage(t('settings.sources.minOneRequired')));
        return previous;
      }
      setWarning('');
      return previous.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      );
    });
  };

  const selectAll = () => {
    setWarning('');
    setSources((previous) => previous.map((s) => ({ ...s, enabled: true })));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
            <Radio className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {formatMessage(t('settings.sources.title'))}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {formatMessage(t('settings.sources.description'))}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="gap-1.5"
          >
            <Check className="size-3.5" />
            {formatMessage(t('settings.sources.selectAll'))}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {sources.map((source) => (
            <label
              key={source.id}
              htmlFor={`source-${source.id}`}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all',
                source.enabled
                  ? 'border-foreground bg-secondary/50'
                  : 'border-border bg-card hover:border-muted-foreground'
              )}
            >
              <Checkbox
                id={`source-${source.id}`}
                checked={source.enabled}
                onCheckedChange={() => toggleSource(source.id)}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  source.enabled ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {formatMessage(t(source.labelKey))}
              </span>
            </label>
          ))}
        </div>

        {warning && (
          <p className="mt-3 rounded-lg bg-destructive px-3 py-2 text-xs text-destructive-foreground">
            {warning}
          </p>
        )}
      </div>
    </div>
  );
}
