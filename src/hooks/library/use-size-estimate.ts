import { useCallback, useState } from 'react';

import { SW_EVENTS } from '@/constants';
import { getSW, openChannel } from '@/helpers';
import { SizeEstimate, Track } from '@/types';

export function useSizeEstimate(track: Track | null) {
  const [estimate, setEstimate] = useState<SizeEstimate>({
    totalSize: 0,
    alreadyDownloaded: 0,
    loading: false,
    error: false,
  });

  const fetchEstimate = useCallback(async () => {
    if (!track) return null;

    setEstimate({
      totalSize: 0,
      alreadyDownloaded: 0,
      loading: true,
      error: false,
    });

    try {
      const sw = await getSW();
      if (!sw) throw new Error('SW unavailable');

      const result = await new Promise<{
        totalSize: number;
        alreadyDownloaded: number;
        error?: boolean;
      }>((resolve, reject) => {
        const { port, cleanup } = openChannel(sw, {
          type: SW_EVENTS.ESTIMATE_SIZE,
          id: track.id,
          url: track.link,
        });

        const timer = setTimeout(() => {
          cleanup();
          reject(new Error('timeout'));
        }, 5000);

        port.addEventListener('message', (e: MessageEvent) => {
          clearTimeout(timer);
          cleanup();
          resolve(e.data);
        });

        port.start();
      });

      const finalEstimate: SizeEstimate = {
        totalSize: result.totalSize ?? 0,
        alreadyDownloaded: result.alreadyDownloaded ?? 0,
        loading: false,
        error: result.error ?? false,
      };

      setEstimate(finalEstimate);

      // ✅ RETURN IT
      return finalEstimate;
    } catch (error) {
      console.error('failed to fetch estimate', error);

      const failed: SizeEstimate = {
        totalSize: 0,
        alreadyDownloaded: 0,
        loading: false,
        error: true,
      };

      setEstimate(failed);
      return failed;
    }
  }, [track]);

  return { estimate, fetchEstimate };
}
