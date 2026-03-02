'use client';

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { DOWNLOAD_STATUS } from '@/constants';
import { getDownloadMeta, getMessageConfig } from '@/helpers';
import { useLibraryData } from '@/hooks/library/use-library';
import { useLibraryTrackActions } from '@/hooks/library/use-library-track-actions';
import { useSizeEstimate } from '@/hooks/library/use-size-estimate';
import { usePlayer } from '@/hooks/player/use-player';
import { useRecitersData } from '@/hooks/reciters';
import { activeTrackAtom } from '@/jotai/player';
import { toLibraryTrack } from '@/utils';

import ControlButton from '../control-button';

export default function DownloadButton() {
  const activeTrack = useAtomValue(activeTrackAtom);
  const { tracks } = useLibraryData();
  const { reciters } = useRecitersData();
  const { playlist, trackIndex, duration } = usePlayer();
  const { confirmDownloadWithStatus } = useLibraryTrackActions();

  const reciter = useMemo(
    () =>
      activeTrack
        ? reciters.find((r) => String(r.id) === activeTrack.reciterId)
        : null,
    [reciters, activeTrack]
  );

  const playlistItem = useMemo(
    () =>
      playlist.find((item) => item.link === activeTrack?.link) ??
      playlist[trackIndex],
    [playlist, activeTrack, trackIndex]
  );

  const libraryTrack = activeTrack
    ? tracks.find((t) => t.id === activeTrack.id)
    : null;

  const { id, icon, disabled } = getDownloadMeta(libraryTrack?.status ?? null);
  const status = libraryTrack?.status ?? null;
  const { estimate, fetchEstimate } = useSizeEstimate(libraryTrack ?? null);

  const estimatedSeconds = useMemo(() => {
    if (!libraryTrack?.speed || !estimate.totalSize) return undefined;
    const remaining = estimate.totalSize - estimate.alreadyDownloaded;
    return remaining > 0 ? Math.ceil(remaining / libraryTrack.speed) : 0;
  }, [estimate, libraryTrack]);

  const handleClick = async () => {
    if (!activeTrack || status === DOWNLOAD_STATUS.DOWNLOADING) return;

    const track = toLibraryTrack({
      reciter,
      playlistItem,
      duration,
    });

    if (!track) return;

    const estimate = await fetchEstimate();

    if (!estimate || estimate.error) return;

    await confirmDownloadWithStatus(track, {
      totalSize: estimate.totalSize,
      remainingBytes: estimate.totalSize - estimate.alreadyDownloaded,
      estimatedSeconds,
    });
  };

  if (!activeTrack) return null;

  return (
    <ControlButton
      onClick={handleClick}
      disabled={disabled}
      {...getMessageConfig(id)}
      formatMessageOptions={{ progress: libraryTrack?.progress }}
      icon={icon}
      extraClass="size-6"
    />
  );
}
