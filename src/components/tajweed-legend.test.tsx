import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TajweedLegend } from './tajweed-legend';

describe('TajweedLegend', () => {
  it('lists every group in Arabic by default', () => {
    render(<TajweedLegend />);

    expect(screen.getByLabelText('أحكام التجويد')).toBeInTheDocument();
    for (const label of [
      'مد',
      'غنة',
      'قلقلة',
      'إدغام',
      'إخفاء',
      'إقلاب',
      'وصل',
      'شمسية',
      'صامت',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('switches labels for English', () => {
    render(<TajweedLegend locale="en" />);

    expect(screen.getByText('Madd')).toBeInTheDocument();
    expect(screen.getByText('Ghunnah')).toBeInTheDocument();
  });
});
