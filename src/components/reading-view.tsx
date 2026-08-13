'use client';

import { useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { useAyahTracking } from '@/hooks/use-ayah-tracking';
import { useSurahText } from '@/hooks/use-surah-text';
import { currentAyahAtom } from '@/jotai/atom';
import { cn, removeTashkeel } from '@/utils';

// Bismillah rendered at the head of every surah except At-Tawbah (9).
// Surah 1 already includes it as its first ayah.
const BISMILLAH = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ';

const ARABIC_INDIC_DIGITS: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

const toArabicIndic = (value: number): string =>
  String(value).replaceAll(
    /\d/g,
    (digit) => ARABIC_INDIC_DIGITS[digit] ?? digit
  );

type Props = {
  surahId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onAyahSelect: (seconds: number) => void;
};

export default function ReadingView({
  surahId,
  currentTime,
  duration,
  isPlaying,
  onAyahSelect,
}: Props) {
  const { surahText, loading, error } = useSurahText(surahId);
  const { timestamps, currentAyahIndex } = useAyahTracking({
    ayahs: surahText?.ayahs ?? [],
    currentTime,
    duration,
  });

  const setCurrentAyah = useSetAtom(currentAyahAtom);
  const ayahReferences = useRef<Array<HTMLButtonElement | null>>([]);
  const { locale, formatMessage } = useIntl();

  useEffect(() => {
    setCurrentAyah(currentAyahIndex);
  }, [currentAyahIndex, setCurrentAyah]);

  // Keep the highlighted ayah in view while following the recitation.
  useEffect(() => {
    if (currentAyahIndex === null) return;
    ayahReferences.current[currentAyahIndex]?.scrollIntoView({
      block: 'center',
      behavior: isPlaying ? 'smooth' : 'auto',
    });
  }, [currentAyahIndex, isPlaying]);

  const surahNumber = Number(surahId);
  const surahMeta = useMemo(
    () => SURAHS.find((surah) => surah.id === surahNumber),
    [surahNumber]
  );

  const surahName = useMemo(() => {
    if (!surahMeta) return '';
    return locale === 'en'
      ? surahMeta.englishName
      : removeTashkeel(surahMeta.name);
  }, [surahMeta, locale]);

  const showBismillah =
    surahNumber > 1 && surahNumber !== 9 && (surahText?.ayahs.length ?? 0) > 0;

  if (loading) {
    return (
      <div className="mt-3 w-full max-w-xl animate-pulse space-y-2 rounded-md border border-gray-200 p-4 shadow-md dark:border-gray-200/50">
        <div className="mx-auto h-4 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-16 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-16 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-16 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (error || !surahText || surahText.ayahs.length === 0) {
    return (
      <div className="mt-3 w-full max-w-xl rounded-md border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
        {error ??
          formatMessage({
            id: 'reading.noText',
            defaultMessage: 'No text available for this surah.',
          })}
      </div>
    );
  }

  const handleAyahClick = (index: number) => {
    const start = timestamps[index]?.start;
    if (typeof start === 'number') onAyahSelect(start);
  };

  return (
    <div className="mt-3 w-full max-w-xl rounded-md border border-gray-200 bg-surface p-4 text-foreground shadow-md dark:border-gray-200/50">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <span className="text-accent">{surahNumber}</span>
          <span>{surahName}</span>
        </h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {formatMessage({
            id: 'reading.estimated',
            defaultMessage: '~ Estimated timing',
          })}
        </span>
      </div>

      <div
        dir="rtl"
        className="max-h-[55vh] space-y-3 overflow-y-auto pe-1 text-right font-amiri"
      >
        {showBismillah && (
          <div className="pt-1 text-center text-2xl leading-relaxed">
            {BISMILLAH}
          </div>
        )}

        {surahText.ayahs.map((ayah, index) => {
          const isCurrent = currentAyahIndex === index;
          return (
            <button
              key={ayah.numberInSurah}
              ref={(element) => {
                ayahReferences.current[index] = element;
              }}
              type="button"
              onClick={() => handleAyahClick(index)}
              className={cn(
                'block w-full rounded-lg px-2 py-1 text-right text-start text-[1.35rem] leading-[2.2rem] transition-colors',
                isCurrent
                  ? 'bg-sky-100/90 ring-1 ring-sky-300 dark:bg-sky-900/40 dark:ring-sky-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800/70'
              )}
            >
              <span className="break-words">{ayah.text}</span>
              <span className="ms-2 align-middle text-xl text-accent">
                ﴿{toArabicIndic(ayah.numberInSurah)}﴾
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
