import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AyahAhkam } from '@/services/follow-along/ahkam';

import { AhkamRail } from './ahkam-rail';

const rules: AyahAhkam[] = [
  { storedIndex: 1, group: 'madd' },
  { storedIndex: 2, group: 'ghunnah' },
  { storedIndex: 3, group: 'qalqalah' },
];

const chips = () => within(screen.getByRole('list')).getAllByRole('listitem');

describe('AhkamRail', () => {
  it('renders nothing for an ayah without sound rules', () => {
    const { container } = render(<AhkamRail rules={[]} activeWord={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the rules in word order with their Arabic labels', () => {
    render(<AhkamRail rules={rules} activeWord={null} />);

    expect(chips().map((chip) => chip.textContent)).toEqual([
      'مد',
      'غنة',
      'قلقلة',
    ]);
  });

  it('switches labels with the locale', () => {
    render(<AhkamRail rules={rules} activeWord={null} locale="en" />);

    expect(chips().map((chip) => chip.textContent)).toEqual([
      'Madd',
      'Ghunnah',
      'Qalqalah',
    ]);
    expect(
      screen.getByRole('list', { name: 'Rules in this ayah' })
    ).toBeInTheDocument();
  });

  it('tracks the recited word', () => {
    render(<AhkamRail rules={rules} activeWord={2} />);

    expect(chips()[1]).toHaveAttribute('aria-current', 'true');
    expect(chips()[0]).not.toHaveAttribute('aria-current');
    expect(chips()[2]).not.toHaveAttribute('aria-current');
  });

  it('dims spoken and upcoming words differently from the current one', () => {
    render(<AhkamRail rules={rules} activeWord={2} />);

    const [spoken, current, upcoming] = chips();
    expect(spoken.className).toContain('opacity-45');
    expect(current.className).toContain('opacity-100');
    expect(upcoming.className).toContain('opacity-30');
  });

  it('stays legible when no word is being tracked', () => {
    render(<AhkamRail rules={rules} activeWord={null} />);

    for (const chip of chips()) {
      expect(chip).not.toHaveAttribute('aria-current');
      expect(chip.className).toContain('opacity-75');
    }
  });

  it('gives each chip the colour of its rule group', () => {
    render(<AhkamRail rules={rules} activeWord={null} />);

    expect(chips()[0].querySelector('span')?.style.backgroundColor).toBe(
      'var(--tajweed-madd, #e0a63c)'
    );
  });
});
