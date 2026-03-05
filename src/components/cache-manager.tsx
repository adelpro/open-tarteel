'use client';

import React, { useState } from 'react';
import { useIntl } from 'react-intl';

import { useAudioCache } from '@/hooks/use-audio-cache';
import { cn } from '@/utils';
import { formatBytes as formatCacheBytes } from '@/utils/audio-cache';

import Dialog from './dialog';

export default function CacheManager() {
  const intl = useIntl();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const { cacheStats, cachedEntries, loading, error, operation, clearCache } =
    useAudioCache();

  // Initialize on client side only
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={cn(
          'rounded-md px-3 py-1 text-sm font-medium transition-colors',
          'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
        )}
        disabled
      >
        {intl.locale?.startsWith('ar') ? '💾 التخزين' : '💾 Cache'}
      </button>
    );
  }

  const handleClearAll = async () => {
    if (
      !confirm(
        intl.locale === 'ar'
          ? 'هل أنت متأكد من حذف جميع الملفات المخزنة مؤقتاً؟'
          : 'Are you sure you want to delete all cached files?'
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      await clearCache();
    } finally {
      setClearing(false);
    }
  };

  const isARLocale = intl.locale?.startsWith('ar');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'rounded-md px-3 py-1 text-sm font-medium transition-colors',
          'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
        )}
        title={
          isARLocale ? 'إدارة ذاكرة التخزين المؤقت' : 'Manage offline cache'
        }
      >
        {isARLocale ? '💾 التخزين' : '💾 Cache'}
      </button>
    );
  }

  return (
    <Dialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isARLocale
              ? 'إدارة ذاكرة التخزين المؤقت'
              : 'Offline Cache Manager'}
          </h2>
          <button
            type="button"
            aria-label={isARLocale ? 'إغلاق' : 'Close'}
            onClick={() => setIsOpen(false)}
            className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Statsistic Section */}
        {!loading && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isARLocale ? 'المساحة المستخدمة:' : 'Used:'}
              </span>
              <span className="font-medium">
                {formatCacheBytes(cacheStats.totalSize)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isARLocale ? 'السور المخزنة:' : 'Cached:'}
              </span>
              <span className="font-medium">{cacheStats.entriesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isARLocale ? 'المساحة المتاحة:' : 'Available:'}
              </span>
              <span className="font-medium">
                {formatCacheBytes(cacheStats.availableSpace)}
              </span>
            </div>

            {/* Progress bar */}
            {cacheStats.totalSize > 0 && (
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${Math.min(
                        (cacheStats.totalSize /
                          (cacheStats.totalSize + cacheStats.availableSpace)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* Cached Entries */}
        {!loading && cachedEntries.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {isARLocale ? 'الملفات المخزنة' : 'Cached Files'}
            </h3>
            {cachedEntries.map((entry) => (
              <div
                key={entry.url}
                className="flex items-center justify-between rounded-md bg-gray-50 p-2 dark:bg-slate-800"
              >
                <div className="flex-1 text-sm">
                  <div className="font-medium">{entry.surahName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.reciterName}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {formatCacheBytes(entry.fileSize)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && cachedEntries.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {isARLocale ? 'لا توجد ملفات مخزنة مؤقتاً' : 'No cached files yet'}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
          >
            {isARLocale ? 'إغلاق' : 'Close'}
          </button>
          {cacheStats.entriesCount > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing || operation !== 'idle'}
              className="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {clearing || operation === 'removing'
                ? isARLocale
                  ? 'جاري الحذف...'
                  : 'Clearing...'
                : isARLocale
                  ? 'حذف الكل'
                  : 'Clear All'}
            </button>
          )}
        </div>

        {/* Info Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {isARLocale
            ? 'عند تفعيل التخزين المؤقت، يمكنك الاستماع للسور المخزنة حتى بدون اتصال بالإنترنت.'
            : 'When offline cache is enabled, you can listen to cached surahs even without internet.'}
        </div>
      </div>
    </Dialog>
  );
}
