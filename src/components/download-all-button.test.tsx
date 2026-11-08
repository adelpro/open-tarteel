import { render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import type { Playlist } from '@/types';

import DownloadAllButton from './download-all-button';

const playlist: Playlist = [
  { surahId: '1', link: 'https://cdn.example/001.mp3' },
  { surahId: '2', link: 'https://cdn.example/002.mp3' },
];

const progress = {
  total: 2,
  completed: 1,
  failed: 0,
  downloadedBytes: 1024,
  currentUrl: playlist[0].link,
  currentTrackProgress: 50,
};

function renderButton(
  overrides: Partial<React.ComponentProps<typeof DownloadAllButton>> = {}
) {
  return render(
    <IntlProvider locale="en" messages={{}}>
      <DownloadAllButton
        playlist={playlist}
        cachedCount={0}
        isAllCached={false}
        isOnline
        progress={null}
        onDownloadAll={vi.fn()}
        onRemoveAll={vi.fn()}
        onCancel={vi.fn()}
        {...overrides}
      />
    </IntlProvider>
  );
}

describe('DownloadAllButton', () => {
  it('offers the download action when tracks are missing online', () => {
    renderButton();

    expect(screen.getByText('Download all surahs')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download' })
    ).toBeInTheDocument();
    expect(screen.getByText('0 of 2 surahs saved')).toBeInTheDocument();
  });

  it('replaces the action with a saved state when all tracks are cached', () => {
    renderButton({ cachedCount: 2, isAllCached: true });

    expect(screen.getByText('All surahs saved offline')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 surahs saved')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove all downloads' })
    ).toBeInTheDocument();
  });

  it('disables the download action when offline', () => {
    renderButton({ cachedCount: 1, isOnline: false });

    expect(
      screen.getByText('Offline — downloads unavailable')
    ).toBeInTheDocument();
    expect(screen.getByText('1 of 2 surahs saved')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download' })
    ).not.toBeInTheDocument();
  });

  it('shows cancel instead of download while a download is running', () => {
    renderButton({ progress, cachedCount: 1 });

    expect(screen.getByText('Downloading… 1/2')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancel download' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download' })
    ).not.toBeInTheDocument();
  });
});
