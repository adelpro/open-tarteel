import closeSVG from '@svgs/close.svg';
import Image from 'next/image';
import React from 'react';

import useTorrent from '@/hooks/use-torrent';
import checkedSVG from '@/svgs/checked.svg';
import downloadSVG from '@/svgs/download.svg';
import fileSVG from '@/svgs/file.svg';
import peerSVG from '@/svgs/peer.svg';
import progressSVG from '@/svgs/progress.svg';
import savedSVG from '@/svgs/saved.svg';
import uploadSVG from '@/svgs/upload.svg';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
};
export default function TorrentInfo({ setIsOpen }: Props) {
  const { torrentInfo } = useTorrent();

  if (!torrentInfo) {
    return <></>;
  }
  return (
    <div
      className="text-md m-1 flex flex-col items-center justify-center p-2 text-gray-600 lg:flex-row"
      onClick={() => setIsOpen(false)}
    >
      <div className="flex flex-row gap-1">
        <div className="m-2 flex flex-row gap-1">
          <Image src={downloadSVG} alt="Download" width={20} height={20} />
          <p className="truncate">
            {torrentInfo?.downloadSpeed < 1024 * 1024
              ? `${(torrentInfo?.downloadSpeed / 1024).toFixed(2)} KB/s`
              : `${(torrentInfo?.downloadSpeed / (1024 * 1024)).toFixed(2)} MB/s`}
          </p>
        </div>
        <div className="m-2 flex flex-row gap-1">
          <Image src={uploadSVG} alt="Upload" width={20} height={20} />
          <p className="truncate">
            {torrentInfo?.uploadSpeed < 1024 * 1024
              ? `${(torrentInfo?.uploadSpeed / 1024).toFixed(2)} KB/s`
              : `${(torrentInfo?.uploadSpeed / (1024 * 1024)).toFixed(2)} MB/s`}
          </p>
        </div>
        <div className="m-2 flex flex-row gap-1">
          <Image src={savedSVG} alt="Saved" width={20} height={20} />
          <p>{`${(torrentInfo?.downloaded / 1e6).toFixed(2)}MB`}</p>
        </div>
      </div>
      <div className="flex flex-row gap-1">
        <div className="m-2 flex flex-row gap-1">
          <Image src={progressSVG} alt="Progress" width={20} height={20} />
          <p>{`${(torrentInfo?.progress * 100).toFixed(1)}%`}</p>
        </div>
        <div className="m-2 flex flex-row gap-1">
          <Image src={peerSVG} alt="Peers count" width={20} height={20} />
          <p>{`${torrentInfo?.peers}`}</p>
        </div>
        {torrentInfo?.ready ? (
          <div className="m-2 flex flex-row gap-1">
            <Image src={checkedSVG} alt="Ready status" width={20} height={20} />
            <p>Ready</p>
          </div>
        ) : (
          <div className="m-2 flex flex-row gap-1">
            <Image src={closeSVG} alt="Ready status" width={20} height={20} />
            <p className="truncate">Not ready</p>
          </div>
        )}
        <div className="m-2 flex flex-row gap-1">
          <Image src={fileSVG} alt="files count" width={20} height={20} />
          <p>{`${torrentInfo?.files.length}`}</p>
        </div>
      </div>
    </div>
  );
}
