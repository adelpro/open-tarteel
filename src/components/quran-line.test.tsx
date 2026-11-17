import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fitFontSize, QuranLine, type QuranLineWord } from './quran-line';

const words: QuranLineWord[] = [
  { id: 1, chars: [{ ch: 'قُلْ', rule: null }], state: 'spoken' },
  {
    id: 2,
    chars: [
      { ch: 'هُوَ', rule: null },
      { ch: 'ٱ', rule: 'hamzat_wasl' },
      { ch: 'للَّهُ', rule: null },
    ],
    state: 'current',
  },
  { id: 3, chars: [{ ch: 'أَحَدٌ', rule: 'qalqalah' }], state: 'upcoming' },
];

describe('fitFontSize', () => {
  it('keeps the maximum size when the line fits', () => {
    expect(fitFontSize(400, 400, 21, 14)).toBe(21);
    expect(fitFontSize(300, 400, 21, 14)).toBe(21);
  });

  it('scales proportionally and stops at the floor', () => {
    expect(fitFontSize(600, 400, 21, 14)).toBe(14);
    expect(fitFontSize(420, 400, 21, 10)).toBe(20);
  });

  it('survives an unmeasured element', () => {
    expect(fitFontSize(0, 0, 21, 14)).toBe(21);
  });
});

describe('QuranLine', () => {
  it('renders every word and marks the current one', () => {
    const { container } = render(<QuranLine words={words} ariaLabel="سورة" />);

    expect(screen.getByLabelText('سورة')).toBeInTheDocument();
    expect(screen.getByText('قُلْ')).toBeInTheDocument();
    expect(container.querySelector('[aria-current="true"]')).toHaveTextContent(
      'هُوَٱللَّهُ'
    );
  });

  it('colours an ahkam and leaves everything else in ink', () => {
    const { container } = render(<QuranLine words={words} />);
    const coloured = [...container.querySelectorAll('span[style]')].map(
      (node) => node.getAttribute('style') ?? ''
    );

    // The hamzat wasl in the second word is annotated by the dataset but is not
    // a sound, so qalqalah is the only coloured glyph here.
    expect(coloured).toHaveLength(1);
    expect(coloured[0]).toContain('--tajweed-qalqalah');
  });

  it('leaves writing facts uncoloured', () => {
    const { container } = render(
      <QuranLine
        words={[
          {
            id: 1,
            chars: [
              { ch: 'ٱ', rule: 'hamzat_wasl' },
              { ch: 'ل', rule: 'lam_shamsiyyah' },
              { ch: 'ا', rule: 'silent' },
              { ch: 'م', rule: 'madd_2' },
            ],
          },
        ]}
      />
    );

    const coloured = [...container.querySelectorAll('span[style]')];
    expect(coloured).toHaveLength(1);
    expect(coloured[0]).toHaveTextContent('م');
    expect(coloured[0].getAttribute('style')).toContain('--tajweed-madd');
  });

  it('renders an ayah marker instead of glyphs when asked', () => {
    const { container } = render(
      <QuranLine words={[{ id: 9, chars: [], markerNumber: 112 }]} />
    );

    expect(screen.getByText('١١٢')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
