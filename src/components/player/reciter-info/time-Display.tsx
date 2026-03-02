import { usePlayer } from '@/hooks/player/use-player';
import { formatTime } from '@/utils';

export default function TrackTimeDisplay() {
  const { track, duration, currentTime } = usePlayer();

  if (!track) return null;
  return (
    <div className="relative flex h-full items-end justify-end text-xs font-medium tabular-nums text-muted-foreground">
      <span>{formatTime(currentTime)}</span>
      <span className="mx-1 text-primary/50">/</span>
      <span>{formatTime(duration)}</span>
    </div>
  );
}
