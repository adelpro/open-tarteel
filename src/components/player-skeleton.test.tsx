import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PlayerSkeleton from './player-skeleton';

describe('PlayerSkeleton', () => {
  it('reserves the player card geometry with two slabs', () => {
    render(<PlayerSkeleton />);

    const skeleton = screen.getByRole('status', { name: 'Loading player' });
    expect(skeleton).toHaveStyle({ minHeight: '210px' });
    expect(skeleton.querySelectorAll('[class*="h-[72px]"]')).toHaveLength(1);
    expect(skeleton.querySelectorAll('[class*="h-8"]')).toHaveLength(1);
    expect(skeleton.querySelector('.size-11')).toBeNull();
    expect(skeleton.querySelector('[class*="h-1 "]')).toBeNull();
  });
});
