import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PlayerSkeleton from './player-skeleton';

describe('PlayerSkeleton', () => {
  it('reserves the player card geometry', () => {
    render(<PlayerSkeleton />);

    const skeleton = screen.getByRole('status', { name: 'Loading player' });
    expect(skeleton).toHaveStyle({ minHeight: '194px' });
    expect(skeleton.querySelector('[class*="h-[72px]"]')).not.toBeNull();
    expect(skeleton.querySelectorAll('.size-11')).toHaveLength(7);
  });
});
