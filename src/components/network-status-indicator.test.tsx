import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import NetworkStatusIndicator from './network-status-indicator';

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <IntlProvider
      locale="en"
      messages={{
        'offline.status': 'Offline Mode — Showing downloaded content',
      }}
    >
      {ui}
    </IntlProvider>
  );
}

describe('NetworkStatusIndicator', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  it('renders nothing when user is online', () => {
    renderWithIntl(<NetworkStatusIndicator />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders offline indicator when user goes offline', () => {
    renderWithIntl(<NetworkStatusIndicator />);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('offline'));
    });

    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
    expect(
      screen.getByText('Offline Mode — Showing downloaded content')
    ).toBeInTheDocument();
  });
});
