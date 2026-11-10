import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import PlayerControls from './player-controls';

vi.mock('next/image', () => ({
  default: ({ src }: { src: string }) =>
    React.createElement('img', { src, alt: '' }),
}));
vi.mock('@/hooks/use-offline-download', () => ({
  useOfflineDownload: () => ({
    progress: null,
    lastError: null,
    downloadAllTracks: vi.fn(),
    cancelDownload: vi.fn(),
    removeAllTracks: vi.fn(),
    isAllCached: () => false,
    getCachedCount: () => 0,
    checkStorageAvailable: vi.fn(),
    estimateStorage: vi.fn(),
  }),
}));
vi.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => true,
}));

describe('PlayerControls', () => {
  it('renders the transport without waiting for a client effect', () => {
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={{}}>
        <PlayerControls
          isPlaying={false}
          volumeRef={{ current: null }}
          audioRef={{ current: null }}
          audioElement={null}
          togglePlayPause={vi.fn()}
          handleNextTrack={vi.fn()}
          handlePreviousTrack={vi.fn()}
          togglePlaylistOpen={vi.fn()}
          currentTrackId={0}
          tahfeezActiveRef={{ current: false }}
        />
      </IntlProvider>
    );

    expect(html).toContain('aria-label="Play"');
    expect(html).not.toContain('h-9 w-9');
  });
});
