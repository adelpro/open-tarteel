import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AyahMarker, toArabicDigits } from './ayah-marker';

describe('toArabicDigits', () => {
  it('converts every digit', () => {
    expect(toArabicDigits(112)).toBe('١١٢');
    expect(toArabicDigits('8')).toBe('٨');
  });
});

describe('AyahMarker', () => {
  it('renders Arabic-Indic digits and hides itself from assistive tech', () => {
    const { container } = render(<AyahMarker number={112} />);
    expect(screen.getByText('١١٢')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
