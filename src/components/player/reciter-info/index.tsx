import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { usePlayer } from '@/hooks/player/use-player';
import { useRecitersData } from '@/hooks/reciters';
import { getSurahInfo, removeTashkeel } from '@/utils';

export default function ReciterInfo() {
  const { track } = usePlayer();
  const { locale } = useIntl();
  const { reciters } = useRecitersData();

  const reciter = useMemo(
    () =>
      track ? reciters.find((r) => String(r.id) === track.reciterId) : null,
    [reciters, track]
  );

  if (!track) return null;
  const { surahId } = track;

  const surah = getSurahInfo(surahId);
  const name = locale === 'ar' ? removeTashkeel(surah.name) : surah.englishName;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/10">
        <span>{surahId}</span>
      </div>

      <div className="flex h-full flex-col justify-end">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {name}
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {reciter?.name}
        </p>
      </div>
    </div>
  );
}
