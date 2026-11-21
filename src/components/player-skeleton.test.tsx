import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PlayerSkeleton from './player-skeleton';

describe('PlayerSkeleton', () => {
  it('mirrors the real player card without reserving a fixed height', () => {
    render(<PlayerSkeleton />);

    const skeleton = screen.getByRole('status', { name: 'Loading player' });
    expect(skeleton.className).toContain('max-w-lg');
    expect(skeleton.className).not.toContain('max-w-xl');
    expect(skeleton.style.minHeight).toBe('');

    // Header + visualiser + seek + transport, matching the real card's groups.
    expect(skeleton.querySelectorAll('[class~="h-[72px]"]')).toHaveLength(1);
    expect(skeleton.querySelectorAll('[class~="h-1"]')).toHaveLength(1);
    expect(skeleton.querySelectorAll('.size-11')).toHaveLength(4);
    expect(skeleton.querySelectorAll('.size-14')).toHaveLength(1);
  });
});
