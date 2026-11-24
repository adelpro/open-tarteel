import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import en from '@/locales/en.json';
import { LinkSource, Riwaya } from '@/types';

import ReciterFilters from './reciter-filters';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (
    this: HTMLDialogElement
  ) {
    this.open = false;
  });
});

const callbacks = () => ({
  onSourcesChange: vi.fn(),
  onRiwiyatChange: vi.fn(),
  onDownloadableOnlyChange: vi.fn(),
  onFollowAlongOnlyChange: vi.fn(),
});

const renderFilters = (
  overrides: { followAlongOnly?: boolean } = {},
  cbs = callbacks()
) => {
  render(
    <IntlProvider locale="en" messages={en}>
      <ReciterFilters
        availableSources={[
          { value: LinkSource.QURAN_FOUNDATION, label: 'Quran Foundation' },
        ]}
        availableRiwiyat={[{ value: Riwaya.Hafs, label: 'Hafs' }]}
        selectedSources={[]}
        selectedRiwiyat={[]}
        onSourcesChange={cbs.onSourcesChange}
        onRiwiyatChange={cbs.onRiwiyatChange}
        downloadableOnly={false}
        onDownloadableOnlyChange={cbs.onDownloadableOnlyChange}
        followAlongOnly={overrides.followAlongOnly ?? false}
        onFollowAlongOnlyChange={cbs.onFollowAlongOnlyChange}
        resultCount={3}
      />
    </IntlProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
  return cbs;
};

describe('ReciterFilters', () => {
  it('toggles the follow-along switch', () => {
    const cbs = renderFilters();

    const toggle = screen.getByRole('switch', { name: 'Follow-along' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(cbs.onFollowAlongOnlyChange).toHaveBeenCalledWith(true);
  });

  it('counts the follow-along filter as active', () => {
    renderFilters({ followAlongOnly: true });

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('clears the follow-along filter along with the others', () => {
    const cbs = renderFilters({ followAlongOnly: true });

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(cbs.onSourcesChange).toHaveBeenCalledWith([]);
    expect(cbs.onRiwiyatChange).toHaveBeenCalledWith([]);
    expect(cbs.onDownloadableOnlyChange).toHaveBeenCalledWith(false);
    expect(cbs.onFollowAlongOnlyChange).toHaveBeenCalledWith(false);
  });
});
