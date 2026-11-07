import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AudioBarsVisualizer from './audio-bars-visualizer';

describe('AudioBarsVisualizer', () => {
  it('renders nothing for non-CORS providers', () => {
    const { container } = render(
      <AudioBarsVisualizer audioId="audio" isPlaying={true} enabled={false} />
    );

    expect(container.querySelectorAll('.spectrum-bar')).toHaveLength(0);
    expect(container.firstElementChild).toBeNull();
  });

  it('renders nothing before the first play', () => {
    const { container } = render(
      <AudioBarsVisualizer audioId="audio" isPlaying={false} enabled={true} />
    );

    expect(container.querySelectorAll('.spectrum-bar')).toHaveLength(0);
    expect(container.firstElementChild).toBeNull();
  });
});
