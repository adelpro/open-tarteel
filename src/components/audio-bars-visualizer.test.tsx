import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AudioBarsVisualizer from './audio-bars-visualizer';

describe('AudioBarsVisualizer', () => {
  it('renders the CSS fallback for non-CORS providers', () => {
    const { container } = render(
      <AudioBarsVisualizer audioId="audio" isPlaying={false} enabled={false} />
    );

    expect(container.querySelectorAll('.spectrum-bar')).toHaveLength(28);
    expect(
      container.querySelector('[aria-hidden="true"]')?.className
    ).toContain('h-[90px]');
  });
});
