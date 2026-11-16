'use client';

import { useEffect, useState } from 'react';

import { AhkamRail } from '@/components/ahkam-rail';
import { PitchContour } from '@/components/pitch-contour';
import { QuranLine, type QuranLineWord } from '@/components/quran-line';
import { TajweedLegend } from '@/components/tajweed-legend';
import { ayahAhkam } from '@/services/follow-along/ahkam';
import type { SurahData } from '@/services/quran-text';
import { ayahWordChars } from '@/services/quran-text/rules';

/**
 * Internal visual harness: the line, legend, ahkam rail and contour with no
 * player, no providers and no network beyond the bundled surah. Never linked
 * publicly.
 */
export default function FollowAlongPreviewPage() {
  const [surah, setSurah] = useState<SurahData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/quran/112.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: SurahData | null) => {
        if (!cancelled && data) setSurah(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      dir="rtl"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6"
    >
      <div>
        <h1 className="text-xl font-semibold">معاينة: تتبّع التلاوة</h1>
        <p className="mt-1 text-sm text-ink-muted">
          صفحة داخلية للمعاينة فقط: سطر واحد، مفتاح الألوان، ومنحنى الصوت بدون
          مشغّل.
        </p>
      </div>

      <TajweedLegend />

      {surah?.ayahs.map((ayah, index) => {
        const stored = ayahWordChars(ayah).filter(
          (word) => word.storedIndex > ayah.b
        );
        const words: QuranLineWord[] = stored.map((word, position) => ({
          id: `${index}-${word.storedIndex}`,
          chars: word.chars,
          state:
            position === 0 ? 'spoken' : position === 1 ? 'current' : 'upcoming',
        }));

        words.push({
          id: `marker-${index}`,
          chars: [],
          markerNumber: index + 1,
        });

        return (
          <div key={index} className="flex flex-col gap-2">
            <QuranLine words={words} ariaLabel={`الآية ${index + 1}`} />
            {/* First ayah shows a followed word, the rest show the idle rail. */}
            <AhkamRail
              rules={ayahAhkam(ayah)}
              activeWord={index === 0 ? (stored[1]?.storedIndex ?? null) : null}
            />
          </div>
        );
      })}

      <PitchContour audio={null} />
    </main>
  );
}
