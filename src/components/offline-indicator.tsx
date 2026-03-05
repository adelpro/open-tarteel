'use client';

import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { cn } from '@/utils';

export default function OfflineIndicator() {
  const intl = useIntl();
  const isARLocale = intl.locale?.startsWith('ar');
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    // Initialize with current online status
    const online = navigator.onLine;
    setIsOnline(online);
    if (!online) {
      setShowIndicator(true);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
        isOnline ? 'animate-pulse bg-green-500' : 'bg-red-500'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isOnline ? 'bg-white' : 'animate-pulse bg-white'
          )}
        />
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
