import {
  DownloadCloud,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { useLibraryPlayer } from '@/hooks/library/use-library-player';
import { useLibraryTrackActions } from '@/hooks/library/use-library-track-actions';
import { Track, TrackFlagsType } from '@/types';

import { IconButton } from './icon-button';

type TrackActionProps = {
  track: Track;
  playLoading: boolean;
  flags: TrackFlagsType;
  onPlay?: (track: Track) => void;
  handlePlay?: (track: Track) => void;
};

export default function TrackActions({
  track,
  flags,
  onPlay,
  playLoading,
  handlePlay,
}: Readonly<TrackActionProps>) {
  const { playTrack } = useLibraryPlayer();
  const { formatMessage } = useIntl();

  const {
    confirmStartDownload,
    confirmPause: pause,
    confirmResume: resume,
    confirmRetry: retry,
    confirmCancel: cancel,
    confirmRemoveFromLibrary,
  } = useLibraryTrackActions();

  const message_ = playLoading
    ? 'library.actions.loading'
    : 'library.actions.play';

  const message = formatMessage(t(message_));

  const handleClick = () => {
    handlePlay?.(track);
  };
  return (
    <>
      <IconButton
        onClick={() => playTrack(track)}
        label={message}
        variant="success"
      >
        {playLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
      </IconButton>

      {flags.isDone && onPlay && (
        <IconButton onClick={handleClick} label={message} variant="success">
          {playLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
        </IconButton>
      )}

      {flags.isIdle && (
        <IconButton
          onClick={() => confirmStartDownload(track)}
          label={formatMessage(t('library.actions.startDownLoad'))}
          variant="primary"
        >
          <DownloadCloud className="size-4" />
        </IconButton>
      )}

      {flags.isDownloading && (
        <IconButton
          onClick={() => pause(track)}
          label={formatMessage(t('library.actions.pause'))}
          variant="primary"
        >
          <Pause className="size-4" />
        </IconButton>
      )}

      {flags.canResume && (
        <IconButton
          onClick={() => resume(track)}
          label={formatMessage(t('library.actions.resume'))}
          variant="primary"
        >
          <Play className="size-4" />
        </IconButton>
      )}

      {(flags.isError || (flags.isIdle && flags.hasPartial)) && (
        <IconButton
          onClick={() => retry(track)}
          label={formatMessage(t('library.actions.retry'))}
        >
          <RotateCcw className="size-4" />
        </IconButton>
      )}

      {(flags.isDownloading || flags.isPaused) && (
        <IconButton
          onClick={() => cancel(track)}
          label={formatMessage(t('library.actions.cancel'))}
          variant="danger"
        >
          <X className="size-4" />
        </IconButton>
      )}

      {(flags.isDone || flags.isIdle || flags.isError) && (
        <IconButton
          onClick={() => confirmRemoveFromLibrary(track)}
          label={formatMessage(t('library.actions.remove'))}
          variant="danger"
        >
          <Trash2 className="size-4" />
        </IconButton>
      )}
    </>
  );
}
