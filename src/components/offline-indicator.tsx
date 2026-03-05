'use client';

import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { cn } from '@/utils';

export default function OfflineIndicator() {
  const intl = useIntl();
  const isARLocale = intl.locale === 'ar';
  const [isOnline, setIsOnline] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize with current online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide indicator after 3 seconds
      const timeout = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timeout);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render until mounted on client to avoid hydration mismatch
  if (!mounted || !showIndicator) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all',
        isOnline
          ? 'bg-green-500 animate-pulse'
          : 'bg-red-500'
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn(
          'h-2 w-2 rounded-full',
          isOnline ? 'bg-white' : 'bg-white animate-pulse'
        )} />
        {isOnline
          ? isARLocale
            ? 'متصل بالإنترنت'
            : 'Back Online'
          : isARLocale
            ? 'غير متصل بالإنترنت - يمكنك تشغيل السور المخزنة مؤقتاً'
            : 'Offline - You can play cached surahs'}
      </div>
    </div>
  );
}
