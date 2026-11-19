import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

  it('colours mapped rules and leaves unmapped text alone', () => {
    const { container } = render(<QuranLine words={words} />);
    const coloured = [...container.querySelectorAll('span[style]')].map(
      (node) => node.getAttribute('style') ?? ''
    );

    expect(coloured).toHaveLength(2);
    expect(coloured[0]).toContain('--tajweed-wasl');
    expect(coloured[1]).toContain('--tajweed-qalqalah');
  });

  it('renders an ayah marker instead of glyphs when asked', () => {
    const { container } = render(
      <QuranLine words={[{ id: 9, chars: [], markerNumber: 112 }]} />
    );

    expect(screen.getByText('١١٢')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('uses the loaded Amiri variable, never the fictional Amiri Quran face', () => {
    const { container } = render(<QuranLine words={words} />);
    const line = container.querySelector('[lang="ar"]') as HTMLElement | null;
    expect(line).not.toBeNull();

    // Vitest does not inject CSS modules. Apply the module's real `.line`
    // rule to the rendered element so the computed family is the one users
    // actually get, not an empty jsdom string.
    const css = readFileSync(
      join(process.cwd(), 'src/components/follow-along.module.css'),
      'utf8'
    );
    const rule = css.match(/\.line\s*\{[^}]*\}/)?.[0];
    expect(rule).toBeDefined();
    // next/font exposes the generated, registered family through this variable.
    expect(rule).toContain('var(--font-amiri)');

    // Simulate that generated family name (jsdom does not resolve var()).
    const loadedFace = '__Amiri_loaded';
    const className = (line as HTMLElement).className.split(/\s+/)[0];
    const style = document.createElement('style');
    style.textContent = (rule as string)
      .replace(/^\.line\b/, `.${className}`)
      .replace('var(--font-amiri)', loadedFace);
    document.head.appendChild(style);

    let fontFamily = '';
    try {
      fontFamily = getComputedStyle(line as HTMLElement).fontFamily;
    } finally {
      style.remove();
    }

    expect(fontFamily).toMatch(new RegExp(`^"?${loadedFace}"?`));
    expect(fontFamily).toContain('Scheherazade New');
    expect(fontFamily).not.toMatch(/Amiri\s+Quran/i);
  });
});
