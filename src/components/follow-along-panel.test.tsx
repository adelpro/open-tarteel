import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AyahData, SurahData } from '@/services/quran-text/types';

import { FollowAlongPanel } from './follow-along-panel';

const text = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ';
const cover = (needle: string, rule: string): [string, number, number] => {
  const start = text.indexOf(needle);
  return [rule, start, start + needle.length];
};

const ayah: AyahData = {
  t: text,
  w: 4,
  b: 0,
  // A sound rule and a non-sound one: only the first belongs on the rail.
  r: [cover('أَحَدٌ', 'ghunnah'), cover('هُوَ', 'hamzat_wasl')],
};

const surah: SurahData = { surah: 112, ayahs: [ayah] };

vi.mock('@/services/quran-text', () => ({
  loadSurah: vi.fn(() => Promise.resolve(surah)),
}));

// The contour owns a canvas and an audio graph; the rail is what is under test.
vi.mock('@/components/pitch-contour', () => ({
  PitchContour: () => null,
}));

const renderPanel = () =>
  render(
    <IntlProvider locale="ar" messages={{}}>
      <FollowAlongPanel
        audio={null}
        source={'quran-foundation' as never}
        moshafId="1"
        surah={112}
      />
    </IntlProvider>
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FollowAlongPanel', () => {
  it('shows the sound rules of the ayah being recited', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          timings: [{ ayah: 1, startMs: 0, endMs: 4000 }],
          words: [
            { ayah: 1, word: 1, startMs: 0, endMs: 900 },
            { ayah: 1, word: 2, startMs: 900, endMs: 1600 },
            { ayah: 1, word: 3, startMs: 1600, endMs: 2400 },
            { ayah: 1, word: 4, startMs: 2400, endMs: 3600 },
          ],
        }),
      }))
    );

    renderPanel();

    const rail = await screen.findByRole('list', { name: 'أحكام الآية' });
    expect(rail.textContent).toBe('غنة');
  });

  it('still lists the rules when the provider has no word timings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          timings: [{ ayah: 1, startMs: 0, endMs: 4000 }],
          words: [{ ayah: 1, word: 1, startMs: 0, endMs: 900 }],
        }),
      }))
    );

    renderPanel();

    // One timed word out of four falls below the coverage gate, so the panel
    // falls back to the ayah — the ahkam are read from the text and survive.
    const rail = await screen.findByRole('list', { name: 'أحكام الآية' });
    expect(rail.textContent).toBe('غنة');
  });
});
