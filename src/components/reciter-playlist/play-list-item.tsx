import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { Surah } from '@/types';
import { cn, removeTashkeel } from '@/utils';

type Props = {
  surah: Surah;
  onClick: () => void;
};

export default function PlayListItem({ surah, onClick }: Readonly<Props>) {
  const { locale, formatMessage } = useIntl();

  return (
    <li key={surah.id} className="bg-card/50 transition-colors hover:bg-card">
      <button
        onClick={() => onClick()}
        className={cn(
          'w-full px-4 py-3 text-left transition-all duration-150',
          'hover:bg-secondary/30 active:bg-primary/15',
          'border-l-2 border-transparent hover:border-primary/50'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Track Number Badge */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
            {surah.id}
          </div>

          {/* Track Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {locale === 'en'
                  ? surah.englishName
                  : removeTashkeel(surah.name)}
              </span>
              <span className="inline-flex shrink-0 items-center rounded bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {formatMessage(t('reciters.surah.ayah_count'), {
                  count: surah.ayahCount,
                })}
              </span>
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}
