# Player first-load fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the player appear immediately for a stored reciter, without a catalog round-trip, a layout jump, or an extra client-render skeleton.

**Architecture:** Read the persisted reciter synchronously from `localStorage` at atom creation, redirect from `/` without waiting for the catalog, and make every pre-player state reserve the player card's final geometry. Then remove the controls' client-only skeleton and the visualizer's `null → 72px` mount, and stop persisting the playback position.

**Tech Stack:** Next.js 15 App Router, React 19, Jotai 2 (`atomWithStorage`), Tailwind CSS, Vitest + Testing Library (jsdom), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-10-player-first-load.md`

## Global Constraints

- No new dependencies.
- Keep RTL/LTR and light/dark behaviour unchanged.
- No redesign: same player card, same tokens, same copy.
- Each task must leave `yarn lint`, `yarn type-check`, and `yarn test:run` green.
- Commit messages follow Conventional Commits (commitlint is enabled).

## Review Focus

- **Stale stored reciter:** stored `moshafId` no longer exists upstream. The reciter route must show its error + Retry state, never bounce back to `/` in a loop.
- **Corrupt storage:** `selected-reciter` is invalid JSON or missing `moshaf`. The app must start with no selection instead of throwing during module init.
- **Catalog moshaf mismatch:** the catalog lists the reciter under a different moshaf. The stored moshaf must not be silently replaced on refresh.
- **Non-CORS provider (Itqan):** the reserved visualizer slot must stay 72px with no fake animation, so the card does not collapse after `canUseAudioAnalyser` resolves.
- **Player remount:** switching reciter remounts `Player`; position, duration, and play/pause state must not leak across the remount, and listeners must attach once.

---

### Task 1: Hydrate the selected reciter synchronously

**Files:**
- Modify: `src/jotai/create-atom-with-storage.ts`
- Modify: `src/jotai/atom.ts:58-61`
- Modify: `src/hooks/use-reciters.ts:31-76`
- Test: `src/jotai/atom.test.ts` (create)
- Test: `src/hooks/use-reciters.test.tsx` (create)

**Interfaces:**
- Consumes: nothing new.
- Produces: `createAtomWithStorage<T>(key: string, initialValue: T, options?: { getOnInit?: boolean })`; `selectedReciterAtom` hydrates from `localStorage` before its first read.

- [ ] **Step 1: Write the failing atom test**

```ts
// src/jotai/atom.test.ts
import { createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storedReciter = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1',
    name: 'Hafs',
    riwaya: 'حفص',
    server: 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/',
    surah_total: '1',
    surahIds: '1',
    playlist: [{ surahId: '1', link: 'https://cdn.example/001.mp3' }],
  },
};

describe('selectedReciterAtom', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('reads the stored reciter on the first read', async () => {
    localStorage.setItem('selected-reciter', JSON.stringify(storedReciter));
    const { selectedReciterAtom } = await import('./atom');

    expect(createStore().get(selectedReciterAtom)).toEqual(storedReciter);
  });

  it('falls back to null for corrupt storage', async () => {
    localStorage.setItem('selected-reciter', '{oops');
    const { selectedReciterAtom } = await import('./atom');

    expect(createStore().get(selectedReciterAtom)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn vitest --run src/jotai/atom.test.ts`
Expected: the first test fails with `expected null to deeply equal {...}` (second passes already).

- [ ] **Step 3: Add the `getOnInit` option**

In `src/jotai/create-atom-with-storage.ts`, accept and forward the option:

```ts
export function createAtomWithStorage<T>(
  key: string,
  initialValue: T,
  options?: { getOnInit?: boolean }
) {
  return atomWithStorage<T>(key, initialValue, createStorage<T>(), options);
}
```

In `src/jotai/atom.ts`, enable it only for the selected reciter (other atoms feed SSR-rendered markup such as `<html>` and must keep the default so hydration stays stable):

```ts
export const selectedReciterAtom = createAtomWithStorage<Reciter | null>(
  'selected-reciter',
  null,
  { getOnInit: true }
);
```

- [ ] **Step 4: Run the atom test**

Run: `yarn vitest --run src/jotai/atom.test.ts`
Expected: both tests pass.

- [ ] **Step 5: Write the failing catalog-refresh test**

`useReciters` now sees the stored reciter on its first render, so its refresh branch runs. Pin the safe behaviour:

```tsx
// src/hooks/use-reciters.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { selectedReciterAtom } from '@/jotai/atom';
import { getAllReciters } from '@/utils/api';

import { useReciters } from './use-reciters';

vi.mock('@/utils/api', () => ({ getAllReciters: vi.fn() }));

const stored = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1', name: 'Hafs', riwaya: 'حفص',
    server: 'https://cdn.example/', surah_total: '1', surahIds: '1',
    playlist: [{ surahId: '1', link: 'https://cdn.example/001.mp3' }],
  },
} as never;

const catalogEntry = (moshafId: string, playlist: unknown[] = []) => ({
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: moshafId, name: 'Hafs', riwaya: 'حفص',
    server: 'https://cdn.example/', surah_total: '1', surahIds: '1',
    playlist,
  },
});

const run = (store: ReturnType<typeof createStore>) =>
  renderHook(() => useReciters(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <IntlProvider locale="en" messages={{}}>
        <Provider store={store}>{children}</Provider>
      </IntlProvider>
    ),
  });

describe('useReciters with a stored reciter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not replace the stored moshaf with another one from the catalog', async () => {
    vi.mocked(getAllReciters).mockResolvedValue([catalogEntry('9')] as never);
    const store = createStore();
    store.set(selectedReciterAtom, stored);
    run(store);

    await waitFor(() => expect(getAllReciters).toHaveBeenCalled());
    expect(store.get(selectedReciterAtom)).toBe(stored);
  });

  it('keeps the stored playlist when the catalog entry has none', async () => {
    vi.mocked(getAllReciters).mockResolvedValue([catalogEntry('1')] as never);
    const store = createStore();
    store.set(selectedReciterAtom, stored);
    run(store);

    await waitFor(() =>
      expect(store.get(selectedReciterAtom)?.moshaf.playlist).toHaveLength(1)
    );
  });

  it('clears the selection when the reciter disappears from the catalog', async () => {
    vi.mocked(getAllReciters).mockResolvedValue([] as never);
    const store = createStore();
    store.set(selectedReciterAtom, stored);
    run(store);

    await waitFor(() => expect(store.get(selectedReciterAtom)).toBeNull());
  });
});
```

- [ ] **Step 6: Run it to verify the mismatch test fails**

Run: `yarn vitest --run src/hooks/use-reciters.test.tsx`
Expected: `does not replace the stored moshaf...` FAILS (the atom becomes the catalog moshaf `9`); the other two pass.

- [ ] **Step 7: Tighten the refresh branch in `src/hooks/use-reciters.ts`**

Replace the `matched` lookup so a different moshaf never replaces the selection:

```ts
const matched = data.find(
  (r) =>
    r.id === selectedReciter.id &&
    r.moshaf.id === selectedReciter.moshaf.id
);
if (matched) {
  // Do not throw away a lazily loaded playlist (or a persisted one)
  // when the catalog refreshes with an empty playlist.
  setSelectedReciter((previous) => {
    if (!previous) return matched;
    if (
      previous.moshaf.id === matched.moshaf.id &&
      matched.moshaf.playlist.length === 0 &&
      previous.moshaf.playlist.length > 0
    ) {
      return {
        ...matched,
        moshaf: {
          ...matched.moshaf,
          playlist: previous.moshaf.playlist,
          surah_total: previous.moshaf.surah_total,
        },
      };
    }
    return matched;
  });
} else if (!data.some((r) => r.id === selectedReciter.id)) {
  setSelectedReciter(null);
}
```

A same-id/different-moshaf entry leaves the stored selection untouched.

- [ ] **Step 8: Run the hook test and the full suite**

Run: `yarn vitest --run src/hooks/use-reciters.test.tsx src/jotai/atom.test.ts`
Expected: all pass.
Run: `yarn test:run`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/jotai/create-atom-with-storage.ts src/jotai/atom.ts src/hooks/use-reciters.ts src/jotai/atom.test.ts src/hooks/use-reciters.test.tsx
git commit -m "fix(jotai): hydrate the selected reciter on first read"
```

---

### Task 2: Open the stored reciter without the catalog

**Files:**
- Modify: `src/app/page.tsx:26-59`
- Test: `src/app/page.test.tsx` (create)

**Interfaces:**
- Consumes: `selectedReciterAtom` from Task 1 (non-null on the first client render).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/page.test.tsx
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
vi.mock('@/components/network-status-indicator', () => ({ default: () => null }));
vi.mock('../components/hero', () => ({ default: () => null }));

const storedReciter = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1', name: 'Hafs', riwaya: 'حفص',
    server: 'https://cdn.example/', surah_total: '1',
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
      expect(replace).toHaveBeenCalledWith(
        '/reciter/mp3quran.net-1?moshafId=1'
      )
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn vitest --run src/app/page.test.tsx`
Expected: the first test FAILS (no redirect while `loading` is true).

- [ ] **Step 3: Split redirect from validation in `src/app/page.tsx`**

Redirect as soon as the client is mounted and a reciter is persisted. Do not read `loading` or `reciters` in this effect, and use `replace` so Back does not re-trigger it:

```tsx
useEffect(() => {
  if (!isClient || !selectedReciter) return;

  const targetPath = `/reciter/${selectedReciter.id}?moshafId=${selectedReciter.moshaf.id}`;
  if (`${pathname}?${searchParams.toString()}` !== targetPath) {
    router.replace(targetPath);
  }
}, [isClient, selectedReciter, pathname, searchParams, router]);
```

Keep the existing validation effect, but make it a correction only: it still needs `isClient && !loading && reciters.length > 0` and clears the atom when `reciters` has no entry with the selected `id`.

- [ ] **Step 4: Run the test**

Run: `yarn vitest --run src/app/page.test.tsx`
Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/page.test.tsx
git commit -m "fix(home): open the stored reciter without the catalog"
```

---

### Task 3: Reserve the visualizer slot

**Files:**
- Modify: `src/components/audio-bars-visualizer.tsx:260-278`
- Test: `src/components/audio-bars-visualizer.test.tsx`

**Interfaces:**
- Consumes: existing props `audioId`, `isPlaying`, `enabled`, `model`.
- Produces: the component always renders a `height: 72px` container while mounted; the canvas carries `opacity: 1 | 0`.

- [ ] **Step 1: Replace the existing assertions with the new contract**

```tsx
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

  expect((container.firstElementChild as HTMLElement).style.height).toBe('72px');
  expect(container.querySelector('canvas')?.style.opacity).toBe('0');
});

it('shows the canvas while playing a CORS-capable source', () => {
  const { container } = render(
    <AudioBarsVisualizer audioId="audio" isPlaying={true} enabled={true} />
  );

  expect(container.querySelector('canvas')?.style.opacity).toBe('1');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn vitest --run src/components/audio-bars-visualizer.test.tsx`
Expected: the first two fail with `slot` being `null`.

- [ ] **Step 3: Always render the slot**

Remove both early returns (`if (!enabled) return null;` and `if (!everPlayed && !isPlaying) return null;`). Keep the analyser/draw effects gated exactly as they are. Render:

```tsx
return (
  <div
    className="mb-2 flex w-full max-w-md justify-center"
    style={{ height: HEIGHT }}
    aria-hidden="true"
  >
    <canvas
      ref={canvasRef}
      className="block h-full w-full transition-opacity duration-200"
      style={{ opacity: enabled && isPlaying && showVisualizer ? 1 : 0 }}
    />
  </div>
);
```

- [ ] **Step 4: Run the test**

Run: `yarn vitest --run src/components/audio-bars-visualizer.test.tsx`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/audio-bars-visualizer.tsx src/components/audio-bars-visualizer.test.tsx
git commit -m "fix(player): reserve the visualizer slot"
```

---

### Task 4: Player-shaped loading skeleton

**Files:**
- Create: `src/components/player-skeleton.tsx`
- Modify: `src/app/reciter/[id]/reciter-page.tsx:167-176,204-213`
- Test: `src/components/player-skeleton.test.tsx` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `<PlayerSkeleton />` — `role="status"`, `aria-label="Loading player"`, minimum height 194px, one 72px visualizer slot and seven 44px control slots.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/player-skeleton.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PlayerSkeleton from './player-skeleton';

describe('PlayerSkeleton', () => {
  it('reserves the player card geometry', () => {
    render(<PlayerSkeleton />);

    const skeleton = screen.getByRole('status', { name: 'Loading player' });
    expect(skeleton).toHaveStyle({ minHeight: '194px' });
    expect(skeleton.querySelector('[class*="h-[72px]"]')).not.toBeNull();
    expect(skeleton.querySelectorAll('.size-11')).toHaveLength(7);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn vitest --run src/components/player-skeleton.test.tsx`
Expected: FAIL — cannot resolve `./player-skeleton`.

- [ ] **Step 3: Create `src/components/player-skeleton.tsx`**

Mirror the non-fullscreen card in `player.tsx`: visualizer 72px + 8px margin, 44px controls row, 28px range, 20px track line, 24px padding.

```tsx
export default function PlayerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading player"
      className="flex w-full max-w-xl animate-pulse flex-col items-center justify-center rounded-[16px] border border-border bg-surface p-3"
      style={{ minHeight: 194 }}
    >
      <div className="mb-2 h-[72px] w-full max-w-md rounded-lg bg-surface-sunken" />
      <div className="flex w-full items-center justify-between gap-2 md:gap-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="size-11 rounded-[10px] bg-surface-sunken" />
        ))}
      </div>
      <div className="my-3 h-1 w-full rounded-full bg-surface-sunken" />
      <div className="mt-3 h-4 w-40 rounded-full bg-surface-sunken" />
    </div>
  );
}
```

- [ ] **Step 4: Use it in `src/app/reciter/[id]/reciter-page.tsx`**

Replace all three player-area fallbacks with `<PlayerSkeleton />`: the `!mounted` return, the `reciterReady ? … : <SimpleSkeleton />` branch, and the `Suspense` fallback around `<Player />`. Remove the now-unused `SimpleSkeleton` import.

- [ ] **Step 5: Run the test and the suite**

Run: `yarn vitest --run src/components/player-skeleton.test.tsx`
Expected: PASS.
Run: `yarn type-check && yarn lint`
Expected: no unused-import or type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/player-skeleton.tsx src/components/player-skeleton.test.tsx "src/app/reciter/[id]/reciter-page.tsx"
git commit -m "feat(player): match the loading skeleton to the player card"
```

---

### Task 5: Drop the controls' client-only skeleton

**Files:**
- Modify: `src/components/player-controls.tsx:91,203-205,402-416`
- Test: `src/components/player-controls.test.tsx` (create)

**Interfaces:**
- Consumes: existing props of `PlayerControls`.
- Produces: the controls render the transport on the first render; no `h-9 w-9` placeholder row exists.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/player-controls.test.tsx
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import PlayerControls from './player-controls';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src }: { src: string }) => <img src={src} alt="" />,
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
  it('renders the transport on the first render', () => {
    const { container } = render(
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

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(container.querySelectorAll('div.h-9.w-9')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn vitest --run src/components/player-controls.test.tsx`
Expected: FAIL — no `Play` button on the first render (the skeleton has no labels).

- [ ] **Step 3: Remove the gate**

Delete `const [isClient, setIsClient] = useState(false)`, the `setIsClient(true)` effect, and the `if (!isClient) { … }` block in `src/components/player-controls.tsx`. `Player` is loaded with `ssr: false`, so this component never renders on the server.

- [ ] **Step 4: Run the test**

Run: `yarn vitest --run src/components/player-controls.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/player-controls.tsx src/components/player-controls.test.tsx
git commit -m "fix(player): render the controls on the first client render"
```

---

### Task 6: Keep the playback position session-only

**Files:**
- Modify: `src/jotai/atom.ts:1,40`
- Modify: `src/components/player.tsx:151-187,189-203`
- Test: `src/jotai/atom.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `currentTimeAtom` is a plain Jotai atom initialised to `0`; it never reads or writes `localStorage`.

- [ ] **Step 1: Add the failing assertion**

Append to `src/jotai/atom.test.ts`:

```ts
describe('currentTimeAtom', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('starts at zero even when a stored position exists', async () => {
    localStorage.setItem('current-time', '42');
    const { currentTimeAtom } = await import('./atom');

    expect(createStore().get(currentTimeAtom)).toBe(0);
  });

  it('does not write the position back to storage', async () => {
    localStorage.setItem('current-time', '42');
    const { currentTimeAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = store.sub(currentTimeAtom, () => {});

    store.set(currentTimeAtom, 12);

    expect(localStorage.getItem('current-time')).toBe('42');
    unsubscribe();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn vitest --run src/jotai/atom.test.ts`
Expected: the first new test fails (`42` instead of `0`).

- [ ] **Step 3: Use a plain atom**

In `src/jotai/atom.ts`, import `atom` from `jotai` and replace the storage atom:

```ts
export const currentTimeAtom = atom(0);
```

- [ ] **Step 4: Reset on mount and remove the duplicate effect**

In `src/components/player.tsx`, add next to the other mount effects:

```tsx
useEffect(() => {
  setCurrentTime(0);
}, [setCurrentTime]);
```

Delete the second, identical `audio.addEventListener('play'…)` effect (the block introduced with the comment "Mirror DOM audio events → React state" that repeats immediately after the first one).

- [ ] **Step 5: Run the tests and the suite**

Run: `yarn vitest --run src/jotai/atom.test.ts`
Expected: PASS.
Run: `yarn test:run && yarn type-check && yarn lint`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/jotai/atom.ts src/components/player.tsx src/jotai/atom.test.ts
git commit -m "fix(player): keep the playback position session-only"
```

---

### Task 7: Browser regression for the stored reciter first load

**Files:**
- Test: `tests/player-first-load.spec.ts` (create)

**Interfaces:**
- Consumes: the behaviour from Tasks 1–6.
- Produces: the acceptance test referenced by the spec.

- [ ] **Step 1: Write the test**

```ts
import { expect, test } from '@playwright/test';

const storedReciter = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1',
    name: "Rewayat Hafs A'n Assem - Murattal",
    riwaya: 'حفص',
    server: 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/',
    surah_total: '3',
    surahIds: '1,2,3',
    playlist: [1, 2, 3].map((surah) => ({
      surahId: String(surah),
      link: `https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/${String(surah).padStart(3, '0')}.mp3`,
    })),
  },
};

test('a stored reciter opens its player without the catalog', async ({ page }) => {
  await page.addInitScript(
    (reciter) => {
      localStorage.setItem('locale', JSON.stringify('en'));
      localStorage.setItem('selected-reciter', JSON.stringify(reciter));
    },
    storedReciter
  );
  await page.route(/\/api\/reciters\?/, (route) => route.abort());

  await page.goto('/');

  await expect(page).toHaveURL(
    /\/reciter\/mp3quran\.net-1\?moshafId=1$/
  );
  await expect(page.locator('#audio')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
});

test('the player mount does not shift the layout', async ({ page }) => {
  await page.addInitScript(
    (reciter) => {
      localStorage.setItem('locale', JSON.stringify('en'));
      localStorage.setItem('selected-reciter', JSON.stringify(reciter));
      localStorage.setItem('show-visualizer', JSON.stringify(true));
    },
    storedReciter
  );
  await page.addInitScript(() => {
    const win = window as unknown as { __cls: number };
    win.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{
        value: number;
        hadRecentInput: boolean;
      }>) {
        if (!entry.hadRecentInput) win.__cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto('/');
  await expect(page.locator('#audio')).toHaveCount(1);
  await page.waitForTimeout(1000);

  const cls = await page.evaluate(
    () => (window as unknown as { __cls: number }).__cls
  );
  expect(cls).toBeLessThan(0.05);
});
```

- [ ] **Step 2: Confirm the test pins the regression**

On the pre-fix `develop` commit (`550b417`), run the same command and confirm both tests fail: the first times out on the URL assertion, the second exceeds the CLS threshold. If you are running only after Tasks 1–6, temporarily restore the `loading` guard in the Home redirect effect to see the first failure, then remove it again.
Run: `yarn build && npx playwright test tests/player-first-load.spec.ts`
Expected before the fix: first test times out on the URL assertion; second exceeds the CLS threshold.

- [ ] **Step 3: Run it against the finished branch**

Run: `yarn build && npx playwright test tests/player-first-load.spec.ts`
Expected: both tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/player-first-load.spec.ts
git commit -m "test(player): cover the stored reciter first load"
```

---

## Final verification

- [ ] `yarn test:run` — all unit tests pass.
- [ ] `yarn lint` — no warnings or errors.
- [ ] `yarn type-check` — clean.
- [ ] `yarn build && npx playwright test tests/player-first-load.spec.ts` — both specs pass.
- [ ] Manual: load `/` with a stored reciter while offline (DevTools offline, `/api/reciters` blocked). The player card must appear, the controls must be usable, and the only failure may be audio metadata.
- [ ] Manual: cold load, watch the card — no jump, no empty control row, no `--:--` flash after the first second.
- [ ] Manual: switch reciter from the picker — position resets to `0:00` once, the play icon stays correct, and the audio starts once (no double `play()`).
