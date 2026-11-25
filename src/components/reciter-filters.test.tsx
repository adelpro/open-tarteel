import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { IntlProvider } from 'react-intl';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import en from '@/locales/en.json';
import { LinkSource, Riwaya } from '@/types';

import ReciterFilters from './reciter-filters';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
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
    <Provider>
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
    </Provider>
  );
  fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
  return cbs;
};

const disclosure = (title: string): HTMLDetailsElement => {
  const element = screen.getByText(title).closest('details');
  if (!(element instanceof HTMLDetailsElement)) {
    throw new Error(`No disclosure found for ${title}`);
  }
  return element;
};

describe('ReciterFilters', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

  it('puts the riwaya checkboxes inside a closable disclosure', () => {
    renderFilters();

    const summary = screen.getByText('Riwaya').closest('summary');
    expect(summary).toBeInTheDocument();
    expect(summary?.parentElement).toHaveAttribute('open');
    expect(
      summary?.parentElement?.querySelector('input[type=checkbox]')
    ).toBeInTheDocument();
  });

  it('still toggles a riwaya checkbox inside the disclosure', () => {
    const cbs = renderFilters();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hafs' }));
    expect(cbs.onRiwiyatChange).toHaveBeenCalledWith([Riwaya.Hafs]);
  });

  it('keeps the sources section collapsed after a remount', () => {
    renderFilters();

    const details = disclosure('Source');
    expect(details).toHaveAttribute('open');
    details.open = false;
    fireEvent(details, new Event('toggle'));
    expect(localStorage.getItem('filters-sources-open')).toBe('false');

    cleanup();
    renderFilters();
    expect(disclosure('Source')).not.toHaveAttribute('open');
  });

  it('remembers the riwaya section independently of sources', () => {
    renderFilters();

    const details = disclosure('Riwaya');
    details.open = false;
    fireEvent(details, new Event('toggle'));

    expect(localStorage.getItem('filters-riwayat-open')).toBe('false');
    expect(localStorage.getItem('filters-sources-open')).toBeNull();
  });
});
