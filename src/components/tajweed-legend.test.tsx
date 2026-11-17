import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TajweedLegend } from './tajweed-legend';

describe('TajweedLegend', () => {
  it('lists the ahkam the line can colour, in Arabic by default', () => {
    render(<TajweedLegend />);

    expect(screen.getByLabelText('أحكام التجويد')).toBeInTheDocument();
    for (const label of ['مد', 'غنة', 'قلقلة', 'إدغام', 'إخفاء', 'إقلاب']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // Writing facts are not ahkam and never colour the line, so the key omits
    // them: wasl, shamsiyyah and silent.
    for (const label of ['وصل', 'شمسية', 'صامت']) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it('switches labels for English', () => {
    render(<TajweedLegend locale="en" />);

    expect(screen.getByText('Madd')).toBeInTheDocument();
    expect(screen.getByText('Ghunnah')).toBeInTheDocument();
  });
});
