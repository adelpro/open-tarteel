'use client';

import { useNetworkStatus } from '@/hooks/use-network-status';

export default function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
    >
      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
      Offline
    </div>
  );
}
