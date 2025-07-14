'use client';

import { useAtom, useAtomValue } from 'jotai';
import Script from 'next/script';
import { ReactNode } from 'react';

import MusicPlayer from '@/components/music-player';
import useTorrent from '@/hooks/use-torrent';
import { selectedReciterAtom, webtorrentReadyAtom } from '@/jotai/atom';

import Loader from './loader';

export default function TorrentPlayer() {
  const [webtorrentReady, setWebTorrentReady] = useAtom(webtorrentReadyAtom);
  const { error, setError, torrentInfo } = useTorrent();
  const selectedReciterValue = useAtomValue(selectedReciterAtom);

  const content = (): ReactNode => {
    if (error) {
      return <p className="text-lg">خطأ: {error}</p>;
    }
    if (!webtorrentReady) {
      return (
        <Loader
          message="جاري تحميل Webtorrent"
          textClassName="text-lg"
          rightIcon
        />
      );
    }

    if (!selectedReciterValue?.magnet) {
      return <></>;
    }

    if (!torrentInfo?.ready) {
      return (
        <Loader message="جاري تحميل الملف" textClassName="text-lg" rightIcon />
      );
    }

    // Return a message when ready but no files are found
    if (torrentInfo.files.length === 0) {
      return <p className="text-lg">لم يتم العثور على ملفات</p>;
    }

    // Return empty fragment as the MusicPlayer will be rendered separately
    return <></>;
  };

  return (
    <div className="flex flex-col gap-2">
      {webtorrentReady ? (
        <></>
      ) : (
        <Script
          src="https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js"
          strategy="lazyOnload"
          onLoad={() => {
            setWebTorrentReady(true);
            setError(undefined);
          }}
          onError={() => {
            setError('Failed to load WebTorrent');
            setWebTorrentReady(false);
          }}
        />
      )}
      {torrentInfo?.files.length ? (
        <div className="flex flex-col gap-5">
          <MusicPlayer playlist={torrentInfo.files} />
        </div>
      ) : (
        <></>
      )}

      {content()}
    </div>
  );
}
