'use client';

import { Library } from 'lucide-react';
import { useIntl } from 'react-intl';

import { Badge } from '@/components/ui/badge';
import { getMessageConfig } from '@/helpers';
import { useLibraryData } from '@/hooks/library/use-library';

export default function LibraryHeader() {
  const { tracks } = useLibraryData();
  const { formatMessage } = useIntl();
  return (
    <div className="flex shrink-0 items-center justify-between">
      <div className="flex items-center gap-2">
        <Library className="size-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">
          {formatMessage(getMessageConfig('library'))}
        </h2>
        {!!tracks.length && (
          <Badge variant="secondary" className="text-[11px]">
            {tracks.length}
          </Badge>
        )}
      </div>
    </div>
  );
}
