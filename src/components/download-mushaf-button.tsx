'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiCheck, FiDownload, FiLoader, FiPause, FiPlay, FiTrash2 } from 'react-icons/fi';
import { useIntl } from 'react-intl';

import { Playlist } from '@/types';

type SizeInfo = { total: number; loaded: number };

export default function DownloadMushafButton({
    playlist,
}: {
    playlist: Playlist;
}) {
    const intl = useIntl();
    const [status, setStatus] = useState<
        'checking' | 'idle' | 'downloading' | 'paused' | 'downloaded'
    >('checking');
    const [overallProgress, setOverallProgress] = useState<number>(0);
    const [overallTotal, setOverallTotal] = useState(0);
    const [overallLoaded, setOverallLoaded] = useState(0);

    const sizesRef = useRef<Record<string, SizeInfo>>({});
    const isDownloadingRef = useRef(false);
    const swRef = useRef<ServiceWorker | null>(null);
    const activeUrlRef = useRef<string | null>(null);

    // Helper to format bytes
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Helper to init SW reference
    const getSW = async () => {
        if (!('serviceWorker' in navigator)) return null;
        try {
            const registration = await navigator.serviceWorker.ready;
            return registration.active;
        } catch (e) {
            return null;
        }
    };

    // Check cache status on mount
    useEffect(() => {
        async function checkCacheStatus() {
            const sw = await getSW();
            if (!sw) {
                setStatus('idle');
                return;
            }
            swRef.current = sw;

            let cachedCount = 0;
            let sumSize = 0;

            for (const item of playlist) {
                try {
                    const result = await new Promise<any>((resolve) => {
                        const messageChannel = new MessageChannel();
                        messageChannel.port1.onmessage = (event) => resolve(event.data);
                        sw.postMessage({ action: 'CHECK_CACHED', url: item.link }, [messageChannel.port2]);
                    });

                    if (result.isCached) {
                        cachedCount++;
                        sizesRef.current[item.link] = { total: result.size || 0, loaded: result.size || 0 };
                        sumSize += result.size || 0;
                    }
                } catch (e) {
                    // Ignore
                }
            }

            setOverallLoaded(sumSize);
            if (cachedCount === playlist.length && playlist.length > 0) {
                setOverallTotal(sumSize);
                setStatus('downloaded');
            } else {
                setStatus('idle');
            }
        }

        checkCacheStatus();
    }, [playlist]);

    // Sync isDownloadingRef with status
    useEffect(() => {
        if (status === 'downloading') {
            isDownloadingRef.current = true;
            startDownloadLoop();
        } else {
            isDownloadingRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const startDownloadLoop = async () => {
        const sw = swRef.current;
        if (!sw) return;

        // Use a throttle for progress updates to avoid too many React re-renders
        let lastRenderTime = 0;

        for (const item of playlist) {
            if (!isDownloadingRef.current) break;

            const currentSize = sizesRef.current[item.link];
            if (currentSize && currentSize.loaded >= currentSize.total && currentSize.total > 0) {
                continue;
            }

            try {
                await new Promise((resolve, reject) => {
                    const messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = (event) => {
                        const data = event.data;
                        if (data.progress) {
                            if (!sizesRef.current[item.link]) {
                                sizesRef.current[item.link] = { total: data.total, loaded: 0 };
                            }
                            sizesRef.current[item.link].loaded = data.loaded;
                            sizesRef.current[item.link].total = data.total;

                            // Throttle React state updates to ~every 200ms
                            const now = Date.now();
                            if (now - lastRenderTime > 200) {
                                lastRenderTime = now;
                                updateOverallProgress();
                            }
                        } else if (data.success) {
                            if (!sizesRef.current[item.link]) {
                                sizesRef.current[item.link] = { total: data.total, loaded: data.loaded };
                            }
                            sizesRef.current[item.link].loaded = data.total; // ensure it's 100% matched
                            updateOverallProgress();
                            resolve(data);
                        } else if (data.aborted) {
                            // User paused, which aborted the fetch. Reject to skip to next (which immediately breaks loop)
                            reject(new Error('Aborted by user'));
                        } else if (data.error) {
                            reject(new Error(data.error));
                        }
                    };

                    activeUrlRef.current = item.link;
                    sw.postMessage({ action: 'CACHE_AUDIO', url: item.link }, [messageChannel.port2]);
                });
            } catch (error) {
                if ((error as Error).message !== 'Aborted by user') {
                    console.error('Failed to cache:', item.link, error);
                }
            } finally {
                if (activeUrlRef.current === item.link) {
                    activeUrlRef.current = null;
                }
            }
        }

        if (isDownloadingRef.current) {
            // Finished looping naturally
            let allDone = true;
            for (const item of playlist) {
                const s = sizesRef.current[item.link];
                if (!s || s.loaded < s.total || s.total === 0) {
                    allDone = false;
                    break;
                }
            }

            if (allDone && playlist.length > 0) {
                setStatus('downloaded');
                setOverallProgress(100);
            } else {
                setStatus('paused');
            }
        }
    };

    const updateOverallProgress = () => {
        let sumLoaded = 0;
        let sumTotal = 0;
        let knownCount = 0;

        // Default estimate: 3 MB per missing file
        const DEFAULT_FILE_SIZE = 3 * 1024 * 1024;

        Object.values(sizesRef.current).forEach((s) => {
            sumLoaded += s.loaded;
            if (s.total > 0) {
                sumTotal += s.total;
                knownCount++;
            }
        });

        const averageSize = knownCount > 0 ? (sumTotal / knownCount) : DEFAULT_FILE_SIZE;
        const unknownCount = Math.max(0, playlist.length - knownCount);
        const estimatedTotal = sumTotal + (averageSize * unknownCount);

        setOverallLoaded(sumLoaded);
        setOverallTotal(estimatedTotal);
        setOverallProgress(estimatedTotal > 0 ? Math.round((sumLoaded / estimatedTotal) * 100) : 0);
    };

    const handleDownload = async () => {
        if (!('serviceWorker' in navigator)) {
            alert('Service Worker is not supported in this browser.');
            return;
        }

        const sw = swRef.current || (await getSW());
        if (!sw) {
            alert(
                'Service Worker is not active. Please ensure it is enabled and you are running on localhost or https.'
            );
            return;
        }
        swRef.current = sw;

        updateOverallProgress();
        setStatus('downloading');
    };

    const handlePause = () => {
        setStatus('paused');
        if (activeUrlRef.current && swRef.current) {
            swRef.current.postMessage({ action: 'ABORT_AUDIO', url: activeUrlRef.current });
        }
    };

    const handleResume = () => {
        setStatus('downloading');
    };

    const handleRemove = async () => {
        const sw = swRef.current || (await getSW());
        if (!sw) return;

        setStatus('checking');

        // Abort any active download
        if (activeUrlRef.current) {
            sw.postMessage({ action: 'ABORT_AUDIO', url: activeUrlRef.current });
        }

        for (const item of playlist) {
            try {
                await new Promise((resolve) => {
                    const messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = (event) => resolve(event.data);
                    sw.postMessage({ action: 'REMOVE_AUDIO', url: item.link }, [messageChannel.port2]);
                });
            } catch (e) {
                console.error('Failed to remove:', item.link, e);
            }
        }
        sizesRef.current = {};
        setOverallLoaded(0);
        setOverallTotal(0);
        setOverallProgress(0);
        setStatus('idle');
    };

    if (status === 'checking') {
        return (
            <button
                disabled
                className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-400 transition-colors dark:bg-gray-800 dark:text-gray-500"
            >
                <FiLoader className="animate-spin" />
                {intl.formatMessage({ id: 'mushaf.checkingStatus' })}
            </button>
        );
    }


    if (status === 'downloading') {
        return (
            <button
                onClick={handlePause}
                className="flex items-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 transition-colors dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
            >
                <FiPause />
                <span className="flex flex-col items-start gap-1 leading-tight text-left">
                    <span>{intl.formatMessage({ id: 'mushaf.pauseDownload' }, { progress: overallProgress })}</span>
                    <span className="text-xs opacity-80 font-normal" dir="ltr">
                        {formatBytes(overallLoaded)} / {formatBytes(overallTotal)}
                    </span>
                </span>
            </button>
        );
    }

    if (status === 'paused') {
        return (
            <button
                onClick={handleResume}
                className="flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-200 transition-colors dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
            >
                <FiPlay />
                <span className="flex flex-col items-start gap-1 leading-tight text-left">
                    <span>{intl.formatMessage({ id: 'mushaf.resumeDownload' }, { progress: overallProgress })}</span>
                    <span className="text-xs opacity-80 font-normal" dir="ltr">
                        {formatBytes(overallLoaded)} / {formatBytes(overallTotal)}
                    </span>
                </span>
            </button>
        );
    }

    if (status === 'downloaded') {
        return (
            <button
                onClick={handleRemove}
                title={intl.formatMessage({ id: 'mushaf.removeOffline' })}
                className="flex items-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-red-100 hover:text-red-700 transition-colors dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            >
                <FiTrash2 />
                <span className="flex flex-col items-start gap-1 leading-tight text-left">
                    <span>{intl.formatMessage({ id: 'mushaf.availableOffline' })}</span>
                    {overallTotal > 0 && (
                        <span className="text-xs opacity-80 font-normal" dir="ltr">
                            {formatBytes(overallTotal)}
                        </span>
                    )}
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
        >
            <FiDownload />
            {intl.formatMessage({ id: 'mushaf.download' })}
        </button>
    );
}
