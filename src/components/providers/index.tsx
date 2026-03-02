'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';

import IntlProviderWrapper from '@/components/providers/intl-provider-wrapper';
import { ThemeProvider } from '@/components/providers/theme-provider-wrapper';
import { TooltipProvider } from '@/components/ui/tooltip';
export default function ProvidersWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <NuqsAdapter>
      <IntlProviderWrapper>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider> {children}</TooltipProvider>
        </ThemeProvider>
      </IntlProviderWrapper>
    </NuqsAdapter>
  );
}
