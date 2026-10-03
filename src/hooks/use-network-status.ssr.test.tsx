/**
 * Regression test for the hydration mismatch reported in PR #80 review.
 *
 * Root cause: `useNetworkStatus` seeded its state from `navigator.onLine`
 * during render. On the server `navigator.onLine` is `undefined` (falsy), so
 * the offline banner was server-rendered, while an online client rendered
 * nothing — React then threw "server rendered HTML didn't match the client".
 *
 * The invariant guarded here: the SSR pass and the first client pass must
 * produce the same HTML, so the first render must not depend on browser state.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import NetworkStatusIndicator from '@/components/network-status-indicator';

const messages = {
  'offline.status': 'Offline Mode — Showing downloaded content',
};

function setOnLine(value: boolean | undefined) {
  Object.defineProperty(navigator, 'onLine', {
    value,
    writable: true,
    configurable: true,
  });
}

describe('useNetworkStatus SSR safety', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => setOnLine(true));
  afterEach(() => setOnLine(originalOnLine));

  function renderToStringOnServer() {
    return renderToString(
      <IntlProvider locale="en" messages={messages}>
        <NetworkStatusIndicator />
      </IntlProvider>
    );
  }

  it('renders no offline banner during the server pass (navigator.onLine undefined)', () => {
    // This is what Node does during SSR: `navigator` exists but has no
    // `onLine` property, so it reads as undefined.
    setOnLine(undefined);

    expect(renderToStringOnServer()).not.toContain(
      'aria-label="Offline status"'
    );
  });

  it('renders identical HTML for the server pass and the first client pass', () => {
    // Server pass: no browser state available.
    setOnLine(undefined);
    const serverHtml = renderToStringOnServer();

    // Client pass, still before any effect has run: an online browser.
    setOnLine(true);

    const clientFirstRenderHtml = renderToStringOnServer();

    expect(clientFirstRenderHtml).toBe(serverHtml);
  });
});
