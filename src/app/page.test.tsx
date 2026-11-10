import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
let pathname = '/';
let search = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
  useSearchParams: () => search,
}));
vi.mock('@/hooks/use-reciters', () => ({
  useReciters: () => ({ reciters: [], loading: true, error: null }),
}));
vi.mock('@/components/reciter-selector', () => ({ default: () => null }));
vi.mock('@/components/network-status-indicator', () => ({
  default: () => null,
}));
vi.mock('../components/hero', () => ({ default: () => null }));

const storedReciter = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1',
    name: 'Hafs',
    riwaya: 'حفص',
    server: 'https://cdn.example/',
    surah_total: '1',
    playlist: [{ surahId: '1', link: 'https://cdn.example/001.mp3' }],
  },
};

describe('Home', () => {
  beforeEach(() => {
    pathname = '/';
    search = new URLSearchParams();
    replace.mockClear();
    localStorage.clear();
    vi.resetModules();
  });

  it('opens the stored reciter while the catalog is still loading', async () => {
    localStorage.setItem('selected-reciter', JSON.stringify(storedReciter));
    const { default: Home } = await import('./page');
    render(<Home />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/reciter/mp3quran.net-1?moshafId=1')
    );
  });

  it('does nothing when already on the target route', async () => {
    pathname = '/reciter/mp3quran.net-1';
    search = new URLSearchParams('moshafId=1');
    localStorage.setItem('selected-reciter', JSON.stringify(storedReciter));
    const { default: Home } = await import('./page');
    render(<Home />);

    expect(replace).not.toHaveBeenCalled();
  });

  it('stays on the picker when nothing is stored', async () => {
    const { default: Home } = await import('./page');
    render(<Home />);

    expect(replace).not.toHaveBeenCalled();
  });
});
