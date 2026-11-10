import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AudioBarsVisualizer from './audio-bars-visualizer';

describe('AudioBarsVisualizer', () => {
  it('reserves the spectrum slot before the first play', () => {
    const { container } = render(
      <AudioBarsVisualizer audioId="audio" isPlaying={false} enabled={true} />
    );

    const slot = container.firstElementChild as HTMLElement;
    expect(slot).not.toBeNull();
    expect(slot.style.height).toBe('72px');
    expect(container.querySelector('canvas')?.style.opacity).toBe('0');
  });

  it('reserves the slot for non-CORS providers without drawing', () => {
    const { container } = render(
      <AudioBarsVisualizer audioId="audio" isPlaying={true} enabled={false} />
    );

    expect((container.firstElementChild as HTMLElement).style.height).toBe(
      '72px'
    );
    expect(container.querySelector('canvas')?.style.opacity).toBe('0');
  });

  it('shows the canvas while playing a CORS-capable source', () => {
    const { container } = render(
      <AudioBarsVisualizer audioId="audio" isPlaying={true} enabled={true} />
    );

    expect(container.querySelector('canvas')?.style.opacity).toBe('1');
  });
});
