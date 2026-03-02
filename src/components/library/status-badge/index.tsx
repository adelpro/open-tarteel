'use client';

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Pause,
  RefreshCw,
} from 'lucide-react';
import { useIntl } from 'react-intl';

import { Badge } from '@/components/ui/badge';
import { DOWNLOAD_STATUS } from '@/constants';
import { getMessageConfig as t } from '@/helpers';
import { MessageKey, Track } from '@/types';
import { cn } from '@/utils';

const statusConfig: Record<
  Track['status'],
  {
    label: string;
    icon: React.ElementType;
    className: string;
    id: MessageKey;
  }
> = {
  idle: {
    label: 'Idle',
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-border',
    id: 'library.trackStatus.idle',
  },
  queued: {
    label: 'Queued',
    icon: Clock,
    className: 'bg-secondary text-secondary-foreground border-border',
    id: 'library.trackStatus.queued',
  },
  downloading: {
    label: 'Downloading',
    icon: Download,
    className: 'bg-primary/10 text-primary border-primary/20 animate-pulse',
    id: 'library.trackStatus.downloading',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    className: 'bg-warning/10 text-warning-foreground border-warning/20',
    id: 'library.trackStatus.paused',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    className: 'bg-success/10 text-success border-success/20',
    id: 'library.trackStatus.done',
  },
  error: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    id: 'library.trackStatus.error',
  },
  updating: {
    label: 'Updating',
    icon: RefreshCw,
    className: 'bg-primary/10 text-primary border-primary/20',
    id: 'library.trackStatus.updating',
  },
};

export function StatusBadge({ status }: { readonly status: Track['status'] }) {
  const { formatMessage } = useIntl();
  if (DOWNLOAD_STATUS.IDLE === status) return;
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 px-2 py-0.5 text-xs font-medium', config.className)}
    >
      <Icon
        className={cn(
          'size-3',
          status === DOWNLOAD_STATUS.UPDATING && 'animate-spin',
          status === DOWNLOAD_STATUS.DOWNLOADING && 'animate-bounce'
        )}
      />
      {formatMessage(t(config.id))}
    </Badge>
  );
}
