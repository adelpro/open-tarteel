import { AlertCircle, Check, Download, Loader2 } from 'lucide-react';

import { DOWNLOAD_STATUS } from '@/constants';
import { MessageKey } from '@/types';

type DownloadMeta = {
  id: MessageKey;
  icon: typeof Download;
  disabled: boolean;
};

export function getDownloadMeta(status: string | null): DownloadMeta {
  switch (status) {
    case DOWNLOAD_STATUS.DONE:
      return {
        id: 'player.availableOffline',
        icon: Check,
        disabled: true,
      };

    case DOWNLOAD_STATUS.DOWNLOADING:
      return {
        id: 'player.downloading',
        icon: Loader2,
        disabled: true,
      };

    case DOWNLOAD_STATUS.PAUSED:
      return {
        id: 'player.downloadFailedRetry',
        icon: AlertCircle,
        disabled: false,
      };

    default:
      return {
        id: 'player.download',
        icon: Download,
        disabled: false,
      };
  }
}
