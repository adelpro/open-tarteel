'use client';

import { useAtom } from 'jotai';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiInfo } from 'react-icons/fi';
import { MdArrowBack } from 'react-icons/md';
import { FormattedMessage, useIntl } from 'react-intl';

import CacheManagement from '@/components/cache-management';
import LanguageSwitcher from '@/components/language-switcher';
import ProviderBadges from '@/components/provider-badge';
import ThemePicker from '@/components/theme-picker';
import Row from '@/components/ui/row';
import Segmented from '@/components/ui/segmented';
import Switch from '@/components/ui/switch';
import useDirection from '@/hooks/use-direction';
import { useLocalePath } from '@/hooks/use-locale-path';
import {
  ahkamTagsAtom,
  enabledSourcesAtom,
  followAlongLineAtom,
  forcedOfflineAtom,
  spectrumEnabledAtom,
  visualizerModelAtom,
} from '@/jotai/atom';
import { isMp3QuranV4Enabled } from '@/services/reciters/flags';
import { LinkSource } from '@/types';

const AVAILABLE_SOURCES: { source: LinkSource; id: string }[] = [
  // The two word-timing providers are the defaults, so they come first.
  {
    source: LinkSource.QURAN_FOUNDATION,
    id: 'settings.source.quranfoundation',
  },
  ...(isMp3QuranV4Enabled()
    ? [
        {
          source: LinkSource.MP3QURAN_V4,
          id: 'settings.source.mp3quranv4',
        },
      ]
    : []),
  { source: LinkSource.MP3QURAN, id: 'settings.source.mp3quran' },
  { source: LinkSource.ITQAN, id: 'settings.source.itqan' },
  { source: LinkSource.QURANAI, id: 'settings.source.quranai' },
];

function Group({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="px-1">
        <div className="flex min-h-6 items-center justify-between gap-3">
          <h2 className="text-[12px] font-bold text-ink-muted">{title}</h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {description ? (
          <p className="mt-0.5 text-[12px] text-ink-muted">{description}</p>
        ) : null}
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-[16px] border border-border bg-surface">
        {children}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { isRTL } = useDirection();
  const { formatMessage } = useIntl();
  const router = useRouter();
  const localePath = useLocalePath();
  const [enabledSources, setEnabledSources] = useAtom(enabledSourcesAtom);
  const [forcedOffline, setForcedOffline] = useAtom(forcedOfflineAtom);
  const [visualizerModel, setVisualizerModel] = useAtom(visualizerModelAtom);
  const [followAlongLine, setFollowAlongLine] = useAtom(followAlongLineAtom);
  const [spectrumEnabled, setSpectrumEnabled] = useAtom(spectrumEnabledAtom);
  const [ahkamTags, setAhkamTags] = useAtom(ahkamTagsAtom);
  const [showAvailability, setShowAvailability] = useState(false);

  const toggleSource = (source: LinkSource) => {
    setEnabledSources((previous) => {
      if (previous.includes(source)) {
        if (previous.length <= 1) return previous;
        return previous.filter((value) => value !== source);
      }
      return [...previous, source];
    });
  };

  const selectAll = () => {
    setEnabledSources(AVAILABLE_SOURCES.map(({ source }) => source));
  };

  const handleBack = () => {
    // Home in the language you are reading. `router.back()` landed on this same
    // page in the previous language whenever the language had just been
    // switched, which read as a reset rather than a back.
    router.replace(localePath('/'));
  };

  return (
    <div
      className="flex w-full flex-col items-center pb-24 pt-6 sm:pb-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto w-full max-w-xl px-4">
        <header className="mb-6 flex items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label={formatMessage({
              id: 'settings.back',
              defaultMessage: 'Back',
            })}
            className="-ms-2 flex size-11 shrink-0 items-center justify-center rounded-[10px] text-ink-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-ink"
          >
            <MdArrowBack className="size-5 rtl:rotate-180" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-tight text-ink">
              <FormattedMessage id="settings.title" defaultMessage="Settings" />
            </h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              <FormattedMessage
                id="settings.subtitle"
                defaultMessage="Language, appearance, and downloads for this device."
              />
            </p>
          </div>
        </header>

        <div className="space-y-8">
          <Group
            title={formatMessage({
              id: 'settings.appearance',
              defaultMessage: 'Appearance',
            })}
          >
            <div className="p-4">
              <p className="text-[15px] font-bold text-ink">
                <FormattedMessage id="settings.theme" defaultMessage="Theme" />
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                <FormattedMessage
                  id="settings.themeDescription"
                  defaultMessage="Choose a palette and a light or dark mode."
                />
              </p>
              <ThemePicker className="mt-3" />
            </div>
            <Row
              label={formatMessage({
                id: 'settings.language',
                defaultMessage: 'Language',
              })}
              description={formatMessage({
                id: 'settings.languageDescription',
                defaultMessage: 'Choose the interface language.',
              })}
            >
              <LanguageSwitcher />
            </Row>
          </Group>

          <Group
            title={formatMessage({
              id: 'settings.reciterSources',
              defaultMessage: 'Reciter sources',
            })}
            description={formatMessage({
              id: 'settings.reciterSourcesDescription',
              defaultMessage:
                'Choose which sources to show in the reciter list. At least one stays enabled.',
            })}
            action={
              <button
                type="button"
                onClick={selectAll}
                className="h-11 whitespace-nowrap px-2 text-[13px] font-bold text-primary"
              >
                <FormattedMessage
                  id="settings.selectAll"
                  defaultMessage="Select all"
                />
              </button>
            }
          >
            {AVAILABLE_SOURCES.map(({ source, id }) => (
              <Row
                key={source}
                label={formatMessage({ id, defaultMessage: source })}
                description={<ProviderBadges source={source} max={2} />}
              >
                <Switch
                  checked={enabledSources.includes(source)}
                  onCheckedChange={() => toggleSource(source)}
                  label={formatMessage({ id, defaultMessage: source })}
                />
              </Row>
            ))}
          </Group>

          <Group
            title={formatMessage({
              id: 'settings.playback',
              defaultMessage: 'Playback',
            })}
          >
            <Row
              label={formatMessage({
                id: 'settings.offlineMode',
                defaultMessage: 'Offline mode',
              })}
              description={
                forcedOffline
                  ? formatMessage({
                      id: 'settings.offlineModeActive',
                      defaultMessage:
                        'Offline mode is on. Only downloaded reciters and surahs are available.',
                    })
                  : formatMessage({
                      id: 'settings.offlineModeDescription',
                      defaultMessage:
                        'Use downloaded content only and hide network-only actions.',
                    })
              }
            >
              <Switch
                checked={forcedOffline}
                onCheckedChange={setForcedOffline}
                label={formatMessage({
                  id: 'settings.offlineMode',
                  defaultMessage: 'Offline mode',
                })}
              />
            </Row>
          </Group>

          <Group
            title={formatMessage({
              id: 'settings.spectrum',
              defaultMessage: 'Spectrum',
            })}
            description={formatMessage({
              id: 'settings.spectrumDescription',
              defaultMessage:
                'Choose the shape the spectrum takes while a recitation plays.',
            })}
          >
            <Row
              label={formatMessage({
                id: 'settings.spectrumShow',
                defaultMessage: 'Show spectrum',
              })}
              description={formatMessage({
                id: 'settings.spectrumShowDescription',
                defaultMessage:
                  'Draw the bars, peaks or ribbon while audio plays. Separate from the Quran line.',
              })}
            >
              <Switch
                checked={spectrumEnabled}
                onCheckedChange={setSpectrumEnabled}
                label={formatMessage({
                  id: 'settings.spectrumShow',
                  defaultMessage: 'Show spectrum',
                })}
              />
            </Row>
            <div className="p-4">
              <Segmented
                value={visualizerModel}
                onChange={setVisualizerModel}
                label={formatMessage({
                  id: 'player.visualizerStyle',
                  defaultMessage: 'Spectrum style',
                })}
                options={[
                  {
                    value: 'bars',
                    label: formatMessage({
                      id: 'player.bars',
                      defaultMessage: 'Bars',
                    }),
                  },
                  {
                    value: 'peaks',
                    label: formatMessage({
                      id: 'player.peaks',
                      defaultMessage: 'Peaks',
                    }),
                  },
                  {
                    value: 'ribbon',
                    label: formatMessage({
                      id: 'player.waves',
                      defaultMessage: 'Waves',
                    }),
                  },
                ]}
              />
            </div>
          </Group>

          <Group
            title={formatMessage({
              id: 'settings.followAlong',
              defaultMessage: 'Follow-along',
            })}
            description={formatMessage({
              id: 'settings.followAlongDescription',
              defaultMessage:
                'The word-by-word line shown above the spectrum while a recitation with word timings plays. Independent of the spectrum.',
            })}
          >
            <Row
              label={
                <span className="flex items-center gap-1.5">
                  {formatMessage({
                    id: 'settings.followAlongLine',
                    defaultMessage: 'Quran line',
                  })}
                  <button
                    type="button"
                    onClick={() => setShowAvailability((open) => !open)}
                    aria-expanded={showAvailability}
                    aria-controls="follow-along-availability"
                    aria-label={formatMessage({
                      id: 'settings.followAlongAvailability',
                      defaultMessage: 'Where the line is available',
                    })}
                    className="flex size-5 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
                  >
                    <FiInfo size={13} aria-hidden="true" />
                  </button>
                </span>
              }
              description={
                followAlongLine
                  ? formatMessage({
                      id: 'settings.followAlongLineOn',
                      defaultMessage:
                        'The line follows the reciter word by word.',
                    })
                  : formatMessage({
                      id: 'settings.followAlongLineOff',
                      defaultMessage: 'Hidden. The line is not drawn.',
                    })
              }
            >
              <Switch
                checked={followAlongLine}
                onCheckedChange={setFollowAlongLine}
                label={formatMessage({
                  id: 'settings.followAlongLine',
                  defaultMessage: 'Quran line',
                })}
              />
            </Row>
            <Row
              label={formatMessage({
                id: 'settings.followAlongAhkam',
                defaultMessage: 'Ahkam tags',
              })}
              description={
                followAlongLine
                  ? formatMessage({
                      id: 'settings.followAlongAhkamDescription',
                      defaultMessage:
                        'Marks the rule that applies to each word of the ayah: madd, ghunnah, qalqalah, idgham, ikhfa or iqlab. Only rules the bundled dataset annotates.',
                    })
                  : formatMessage({
                      id: 'settings.followAlongAhkamDisabled',
                      defaultMessage:
                        'Turn the Quran line on first: the marks annotate it.',
                    })
              }
            >
              {/* The marks annotate the line, so they cannot outlive it. */}
              <Switch
                checked={ahkamTags}
                onCheckedChange={setAhkamTags}
                disabled={!followAlongLine}
                label={formatMessage({
                  id: 'settings.followAlongAhkam',
                  defaultMessage: 'Ahkam tags',
                })}
              />
            </Row>
            {showAvailability ? (
              <div
                id="follow-along-availability"
                className="space-y-1.5 px-4 py-3 text-[12px] leading-5 text-ink-muted"
              >
                <p>
                  <FormattedMessage
                    id="settings.followAlongAvailabilityHafs"
                    defaultMessage="Hafs an Asim only, for now."
                  />
                </p>
                <p>
                  <FormattedMessage
                    id="settings.followAlongAvailabilityProviders"
                    defaultMessage="Quran Foundation and the twelve audited MP3Quran v4 recitations. Everything else plays without the line."
                  />
                </p>
                <p>
                  <FormattedMessage
                    id="settings.followAlongAvailabilityText"
                    defaultMessage="Text is Tanzil Uthmani verbatim; the ahkam come from the quran-tajweed dataset (CC BY 4.0)."
                  />
                </p>
                <Link
                  href={localePath('/about')}
                  className="inline-block font-bold text-primary underline-offset-2 hover:underline"
                >
                  <FormattedMessage
                    id="settings.followAlongAvailabilityMore"
                    defaultMessage="About this feature"
                  />
                </Link>
              </div>
            ) : null}
          </Group>

          <Group
            title={formatMessage({
              id: 'settings.cacheManagement',
              defaultMessage: 'Offline downloads',
            })}
            description={formatMessage({
              id: 'settings.cacheManagementDescription',
              defaultMessage:
                'Manage downloaded recitations stored on this device.',
            })}
          >
            <div className="p-4">
              <CacheManagement />
            </div>
          </Group>
        </div>
      </div>
    </div>
  );
}
