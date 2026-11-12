import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Tooltip, { TOOLTIP_HIDE_DELAY_MS } from './tooltip';

describe('Tooltip', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render its label before it is triggered', () => {
    const { queryByRole } = render(
      <Tooltip content="Play">
        <button type="button" aria-label="Play">
          go
        </button>
      </Tooltip>
    );

    expect(queryByRole('tooltip')).toBeNull();
  });

  it('dismisses itself after a delay when hovered', () => {
    vi.useFakeTimers();
    const { getByRole, queryByRole } = render(
      <Tooltip content="Play">
        <button type="button" aria-label="Play">
          go
        </button>
      </Tooltip>
    );

    fireEvent.pointerOver(getByRole('button'));
    expect(getByRole('tooltip')).toHaveTextContent('Play');

    act(() => {
      vi.advanceTimersByTime(TOOLTIP_HIDE_DELAY_MS);
    });
    expect(queryByRole('tooltip')).toBeNull();
  });

  it('dismisses itself after a delay when clicked and left focused', () => {
    vi.useFakeTimers();
    const { getByRole, queryByRole } = render(
      <Tooltip content="Play">
        <button type="button" aria-label="Play">
          go
        </button>
      </Tooltip>
    );

    // A mouse click focuses the button and leaves focus there, which used to
    // keep the label on screen forever (jsdom does not focus on click).
    fireEvent.click(getByRole('button'));
    fireEvent.focus(getByRole('button'));
    expect(getByRole('tooltip')).toHaveTextContent('Play');

    act(() => {
      vi.advanceTimersByTime(TOOLTIP_HIDE_DELAY_MS);
    });
    expect(queryByRole('tooltip')).toBeNull();
  });

  it('hides as soon as the pointer leaves', () => {
    vi.useFakeTimers();
    const { getByRole, queryByRole } = render(
      <Tooltip content="Play">
        <button type="button" aria-label="Play">
          go
        </button>
      </Tooltip>
    );
    const button = getByRole('button');

    fireEvent.pointerOver(button);
    expect(getByRole('tooltip')).toBeInTheDocument();

    fireEvent.pointerOut(button);
    expect(queryByRole('tooltip')).toBeNull();
  });
});
