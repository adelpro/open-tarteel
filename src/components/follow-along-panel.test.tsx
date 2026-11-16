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
  r: [cover('أَحَدٌ', 'ghunnah')],
};

const surah: SurahData = { surah: 112, ayahs: [ayah] };

vi.mock('@/services/quran-text', () => ({
  loadSurah: vi.fn(() => Promise.resolve(surah)),
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

const stubTimings = (words: number) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        timings: [{ ayah: 1, startMs: 0, endMs: 4000 }],
        words: Array.from({ length: words }, (_, index) => ({
          ayah: 1,
          word: index + 1,
          startMs: index * 800,
          endMs: (index + 1) * 800,
        })),
      }),
    }))
  );

describe('FollowAlongPanel', () => {
  it('renders the ayah line and its colour key', async () => {
    stubTimings(4);
    renderPanel();

    const line = await screen.findByLabelText('Ayah 1');
    expect(line.textContent).toContain('قُلْ');
    expect(line.textContent).toContain('أَحَدٌ');
    expect(screen.getByRole('list', { name: 'أحكام التجويد' })).toBeTruthy();
  });

  it('draws nothing but the line', async () => {
    stubTimings(4);
    const { container } = renderPanel();

    await screen.findByLabelText('Ayah 1');
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('still shows the line when the provider has no word timings', async () => {
    stubTimings(1);
    renderPanel();

    const line = await screen.findByLabelText('Ayah 1');
    expect(line.textContent).toContain('أَحَدٌ');
  });
});
