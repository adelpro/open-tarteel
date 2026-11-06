import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AudioBarsVisualizer from './audio-bars-visualizer';

describe('AudioBarsVisualizer', () => {
  it('keeps its height without fake bars for non-CORS providers', () => {
    const { container } = render(
      <AudioBarsVisualizer audioId="audio" isPlaying={true} enabled={false} />
    );

    expect(container.querySelectorAll('.spectrum-bar')).toHaveLength(0);
    expect(container.firstElementChild).toHaveStyle({ height: '90px' });
  });

  it('reserves its height before the first play without fake bars', () => {
    const { container } = render(
      <AudioBarsVisualizer audioId="audio" isPlaying={false} enabled={true} />
    );

    expect(container.querySelectorAll('.spectrum-bar')).toHaveLength(0);
    expect(container.firstElementChild).toHaveStyle({ height: '90px' });
  });
});
