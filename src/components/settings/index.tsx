'use client';

import { HardDrive, Library, Settings, Sliders } from 'lucide-react';
import { useIntl } from 'react-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMessageConfig as t } from '@/helpers';
import useDirection from '@/hooks/use-direction';

import { GeneralSettings } from './general';
import { LibrarySettings } from './library';
import { SourcesSettings } from './sources';
import { StorageSettings } from './storage';

export function SettingsPage() {
  const { formatMessage } = useIntl();
  const { dir } = useDirection();

  return (
    <Tabs
      // FIXME:
      defaultValue="general"
      className="flex h-full w-full flex-col"
      dir={dir}
    >
      <div className="shrink-0 pb-4 pt-6">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
          {formatMessage(t('settings.title'))}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatMessage(t('settings.description'))}
        </p>
      </div>
      <div className="shrink-0 pb-2">
        <TabsList className="mb-4 grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="hidden size-3.5 sm:block" />
            {formatMessage(t('settings.tabs.general'))}
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-1.5 text-xs sm:text-sm">
            <Sliders className="hidden size-3.5 sm:block" />
            {formatMessage(t('settings.tabs.sources'))}
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5 text-xs sm:text-sm">
            <Library className="hidden size-3.5 sm:block" />
            {formatMessage(t('settings.tabs.library'))}
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-1.5 text-xs sm:text-sm">
            <HardDrive className="hidden size-3.5 sm:block" />
            {formatMessage(t('settings.tabs.storage'))}
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="sources">
          <SourcesSettings />
        </TabsContent>
        <TabsContent value="library">
          <LibrarySettings />
        </TabsContent>
        <TabsContent value="storage">
          <StorageSettings />
        </TabsContent>
      </div>
    </Tabs>
  );
}
