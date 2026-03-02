'use client';
import { useAtom } from 'jotai';
import {
  Languages,
  Monitor,
  Moon,
  Play,
  Repeat,
  Shuffle,
  Sun,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { localeAtom } from '@/jotai/atoms';
import {
  settingsPlaybackModeAtom,
  settingsPlaybackSpeedAtom,
  settingsThemeAtom,
} from '@/jotai/settings';
import { cn } from '@/lib/utils';
import { PlaybackMode, PlaybackSpeed } from '@/types';
import { AppTheme } from '@/types/settings';

type settingsCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};
function SettingsCard({
  icon,
  title,
  description,
  children,
}: Readonly<settingsCardProps>) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ThemeSelector() {
  const { setTheme } = useTheme();
  const { formatMessage } = useIntl();
  const [storedTheme, setStoredTheme] = useAtom(settingsThemeAtom);

  const themes = [
    { value: 'light', label: 'settings.general.theme.light', icon: Sun },
    { value: 'dark', label: 'settings.general.theme.dark', icon: Moon },
    {
      value: 'system',
      label: 'settings.general.theme.system',
      icon: Monitor,
    },
  ];

  useEffect(() => {
    setTheme(storedTheme);
  }, [storedTheme, setTheme]);

  return (
    <div className="flex gap-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setStoredTheme(value as AppTheme)}
          className={cn(
            'flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-medium transition-all',
            storedTheme === value
              ? 'border-foreground bg-secondary text-foreground'
              : 'border-border bg-card text-muted-foreground hover:border-muted-foreground hover:bg-secondary/50'
          )}
        >
          <Icon className="size-4" />
          {formatMessage(t(label))}
        </button>
      ))}
    </div>
  );
}

function LanguageSelector() {
  const { formatMessage } = useIntl();
  const [locale, setLocale] = useAtom(localeAtom);

  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';

    setLocale(nextLocale);

    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      router.replace(`/${nextLocale}`);
      return;
    }

    segments[0] = nextLocale;
    router.replace(`/${segments.join('/')}`);
  };

  const languages = [
    {
      value: 'en' as const,
      label: 'settings.general.language.en',
      flag: 'EN',
    },
    {
      value: 'ar' as const,
      label: 'settings.general.language.ar',
      flag: 'AR',
    },
  ];

  return (
    <div className="flex gap-2">
      {languages.map(({ value, label, flag }) => (
        <button
          key={value}
          onClick={handleClick}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all',
            locale === value
              ? 'border-foreground bg-secondary text-foreground'
              : 'border-border bg-card text-muted-foreground hover:border-muted-foreground hover:bg-secondary/50'
          )}
        >
          <span className="text-xs font-bold opacity-60">{flag}</span>
          {formatMessage(t(label))}
        </button>
      ))}
    </div>
  );
}
const PLAYBACK_SPEEDS: PlaybackSpeed[] = [1, 1.5, 2];
const PLAYBACK_MODES: {
  value: PlaybackMode;
  id: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'off',
    id: 'settings.general.playback.off',
    icon: <Play className="size-4" />,
  },
  {
    value: 'repeat-one',
    id: 'settings.general.playback.repeatOne',
    icon: <Repeat className="size-4" />,
  },
  {
    value: 'shuffle',
    id: 'settings.general.playback.shuffle',
    icon: <Shuffle className="size-4" />,
  },
];

export function GeneralSettings() {
  const { formatMessage } = useIntl();

  const [playbackMode, setPlaybackMode] = useAtom(settingsPlaybackModeAtom);
  const [playbackSpeed, setPlaybackSpeed] = useAtom(settingsPlaybackSpeedAtom);

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        icon={<Sun className="size-4" />}
        title={formatMessage(t('settings.general.appearance'))}
        description={formatMessage(
          t('settings.general.appearance.description')
        )}
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {formatMessage(t('settings.general.theme'))}
            </p>
            <ThemeSelector />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Languages className="size-4" />}
        title={formatMessage(t('settings.general.language'))}
        description={formatMessage(t('settings.general.language.description'))}
      >
        <LanguageSelector />
      </SettingsCard>
      <SettingsCard
        icon={<Play className="size-4" />}
        title={formatMessage(t('settings.general.playback'))}
        description={formatMessage(t('settings.general.playback.description'))}
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {formatMessage(t('settings.general.playbackMode'))}
            </p>
            <div className="flex gap-2">
              {PLAYBACK_MODES.map(({ value, id, icon }) => (
                <button
                  key={value}
                  onClick={() => setPlaybackMode(value)}
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-medium transition-all',
                    playbackMode === value
                      ? 'border-foreground bg-secondary text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground hover:bg-secondary/50'
                  )}
                >
                  {icon}
                  {formatMessage(t(id))}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {formatMessage(t('settings.general.playbackSpeed'))}
            </p>
            <div className="flex gap-2">
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={cn(
                    'flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all',
                    playbackSpeed === speed
                      ? 'border-foreground bg-secondary text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground hover:bg-secondary/50'
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
