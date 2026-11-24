'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

import { AhkamRuleKey } from '@/components/ahkam-rule-key';
import { QuranLine, type QuranLineWord } from '@/components/quran-line';
import { ahkamTagsAtom } from '@/jotai/atom';
import {
  ayahAt,
  buildLineStates,
  providerWordToStored,
  WORD_ANTICIPATION_MS,
  wordAt,
} from '@/services/follow-along';
import { loadSurah, type SurahData } from '@/services/quran-text';
import { ayahWordChars, ruleGroupsForWord } from '@/services/quran-text/rules';
import type { AyahTiming, WordTiming } from '@/services/timings';
import { groupByAyah, repairAyah } from '@/services/timings/word-timings';
import type { LinkSource } from '@/types';
import { cn } from '@/utils';

export interface FollowAlongPanelProps {
  /** The player's audio element, read only for its clock. */
  audio: HTMLAudioElement | null;
  source: LinkSource;
  moshafId: string;
  /** 1-based surah number. */
  surah: number;
  className?: string;
}

type Status = 'loading' | 'ready' | 'empty' | 'error';

type TimingBody = {
  timings?: AyahTiming[];
  words?: WordTiming[];
};

/**
 * The mode's glue: fetch the surah text and the provider words, repair them
 * against the reference index, then follow the audio clock. Everything it
 * renders is a dumb component from Phase 4.
 */
export function FollowAlongPanel({
  audio,
  source,
  moshafId,
  surah,
  className,
}: FollowAlongPanelProps) {
  const { formatMessage, locale } = useIntl();
  const showAhkam = useAtomValue(ahkamTagsAtom);
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<{
    surah: SurahData;
    timings: AyahTiming[];
    words: WordTiming[];
  } | null>(null);
  const [active, setActive] = useState<{
    ayah: number;
    stored: number | null;
    fallback: boolean;
  }>({ ayah: 1, stored: null, fallback: false });

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setData(null);

    Promise.all([
      loadSurah(surah, { signal: controller.signal }),
      fetch(
        `/api/timings/${encodeURIComponent(source)}/${encodeURIComponent(
          moshafId
        )}/${surah}`,
        { signal: controller.signal }
      ).then((response) =>
        response.ok
          ? (response.json() as Promise<TimingBody>)
          : Promise.reject(new Error(`timings ${response.status}`))
      ),
    ])
      .then(([surahData, timingBody]) => {
        if (controller.signal.aborted) return;
        const words = timingBody.words ?? [];
        setData({
          surah: surahData,
          timings: timingBody.timings ?? [],
          words,
        });
        setStatus(words.length > 0 ? 'ready' : 'empty');
        setActive({ ayah: 1, stored: null, fallback: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, [source, moshafId, surah]);

  const repaired = useMemo(() => {
    const map = new Map<number, ReturnType<typeof repairAyah>>();
    if (!data) return map;

    for (const [ayah, rows] of groupByAyah(data.words)) {
      const ayahData = data.surah.ayahs[ayah - 1];
      if (!ayahData) continue;
      // Providers count words after the basmala, so the reference count is w-b.
      map.set(ayah, repairAyah(rows, Math.max(0, ayahData.w - ayahData.b)));
    }
    return map;
  }, [data]);

  useEffect(() => {
    if (!audio || !data || repaired.size === 0) return;

    let frame = 0;

    const tick = () => {
      frame = requestAnimationFrame(tick);

      const timeMs = audio.currentTime * 1000;
      const ayah = ayahAt(data.timings, timeMs) ?? 1;
      const ayahData = data.surah.ayahs[ayah - 1];
      if (!ayahData) return;

      const repairedAyah = repaired.get(ayah);
      const fallback = repairedAyah?.fallback ?? true;
      const providerWord =
        repairedAyah && !fallback
          ? wordAt(repairedAyah.words, timeMs + WORD_ANTICIPATION_MS)
          : null;
      const stored =
        providerWord == null
          ? null
          : providerWordToStored(
              source,
              `${surah}:${ayah}`,
              ayahData.b,
              providerWord
            );

      setActive((current) => {
        const held =
          stored == null && current.ayah === ayah ? current.stored : stored;
        if (
          current.ayah === ayah &&
          current.stored === held &&
          current.fallback === fallback
        ) {
          return current;
        }
        return { ayah, stored: held, fallback };
      });
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [audio, data, repaired, source, surah]);

  const line = useMemo<QuranLineWord[]>(() => {
    const ayah = data?.surah.ayahs[active.ayah - 1];
    if (!ayah) return [];

    const words = ayahWordChars(ayah).filter(
      (word) => word.storedIndex > ayah.b
    );
    const states = active.fallback
      ? words.map(() => 'current' as const)
      : buildLineStates(words, active.stored);

    const rendered: QuranLineWord[] = words.map((word, index) => ({
      id: `${active.ayah}-${word.storedIndex}`,
      chars: word.chars,
      state: states[index],
    }));

    rendered.push({
      id: `marker-${active.ayah}`,
      chars: [],
      markerNumber: active.ayah,
    });

    return rendered;
  }, [active, data]);

  // A word can carry several tajweed rules. Highlight every matching tag.
  const activeGroups = useMemo(
    () =>
      ruleGroupsForWord(
        line.find((word) => word.state === 'current')?.chars ?? []
      ),
    [line]
  );

  return (
    <section
      dir="rtl"
      className={cn('flex w-full flex-col gap-2 px-3 pb-2', className)}
    >
      {status === 'loading' && (
        <p className="text-xs text-ink-muted">
          {formatMessage({
            id: 'followAlong.loading',
            defaultMessage: 'Loading word timings',
          })}
        </p>
      )}

      {(status === 'empty' || status === 'error') && (
        <p className="text-xs text-ink-muted">
          {formatMessage({
            id: 'followAlong.noTimings',
            defaultMessage: 'No word timings for this surah.',
          })}
        </p>
      )}

      {status === 'ready' && (
        <>
          <QuranLine
            words={line}
            maxFontSize={20}
            minFontSize={16}
            ariaLabel={formatMessage(
              { id: 'followAlong.ayah', defaultMessage: 'Ayah {ayah}' },
              { ayah: active.ayah }
            )}
          />
          {showAhkam ? (
            <div className="mt-2">
              <AhkamRuleKey
                activeGroups={activeGroups}
                locale={locale === 'ar' ? 'ar' : 'en'}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
