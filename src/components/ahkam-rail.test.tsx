import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AyahAhkam } from '@/services/follow-along/ahkam';

import { AhkamRail } from './ahkam-rail';

const rules: AyahAhkam[] = [
  { storedIndex: 1, group: 'madd' },
  { storedIndex: 2, group: 'ghunnah' },
  { storedIndex: 3, group: 'qalqalah' },
];

const marks = () => screen.getByRole('list').querySelectorAll('li');

describe('AhkamRail', () => {
  it('renders nothing for an ayah without sound rules', () => {
    const { container } = render(<AhkamRail rules={[]} activeWord={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('draws one mark per rule, in word order', () => {
    render(<AhkamRail rules={rules} activeWord={null} />);

    expect(marks()).toHaveLength(3);
    expect(screen.getByText('مد')).toBeInTheDocument();
    expect(screen.getByText('غنة')).toBeInTheDocument();
    expect(screen.getByText('قلقلة')).toBeInTheDocument();
  });

  it('keeps the rule name as text for assistive tech', () => {
    render(<AhkamRail rules={rules} activeWord={null} locale="en" />);

    expect(screen.getByText('Madd')).toHaveClass('sr-only');
  });

  it('gives each mark the colour of its rule group', () => {
    render(<AhkamRail rules={rules} activeWord={null} />);

    expect(marks()[0].getAttribute('style')).toContain('--tajweed-madd');
    expect(marks()[1].getAttribute('style')).toContain('--tajweed-ghunnah');
  });

  it('marks the recited word and nothing else', () => {
    render(<AhkamRail rules={rules} activeWord={2} />);

    expect(marks()[1]).toHaveAttribute('aria-current', 'true');
    expect(marks()[0]).not.toHaveAttribute('aria-current');
    expect(marks()[2]).not.toHaveAttribute('aria-current');
  });

  it('changes scale rather than layout between states', () => {
    render(<AhkamRail rules={rules} activeWord={2} />);

    expect(marks()[0].className).toContain('scale-y-40');
    expect(marks()[1].className).toContain('scale-y-100');
    expect(marks()[2].className).toContain('scale-y-40');
  });

  it('stays legible when no word is being followed', () => {
    render(<AhkamRail rules={rules} activeWord={null} />);

    for (const mark of marks()) {
      expect(mark).not.toHaveAttribute('aria-current');
      expect(mark.className).toContain('scale-y-60');
    }
  });
});
