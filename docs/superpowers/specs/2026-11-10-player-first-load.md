# Player first-load behaviour — spec

## Symptoms reported

1. The player flashes while it mounts.
2. On the first app load after a reciter is stored in `localStorage`, the
   player does not appear.
3. The player takes too long to appear.

## Verified evidence (develop, 2026-11-10)

Measured with Playwright against `next dev`; structural findings do not depend
on compile time.

- **Layout jump:** cold-load CLS 0.12–0.19. `main` resizes `474 → 668px`
  (+194px) when the player card mounts. The loading fallback (`SimpleSkeleton`,
  3 thin lines) does not reserve the player card's height.
- **Catalog dependency:** `/` redirects to the player only after
  `/api/reciters` resolves and the stored reciter is found in the catalog.
  Delaying that request delays the redirect; aborting it leaves the user on
  `/` forever even with a complete 114-track playlist in `localStorage`.
- **Stacked gates:** static `/` shell → catalog fetch → `router.push` →
  `mounted` gate → dynamic `Player` chunk → `PlayerControls` `isClient` gate.
  Player appeared at ~2.2s direct and ~3.7s from `/`; LCP 1128ms with a stored
  reciter vs 408ms fresh.
- **Stale position:** `currentTime` is persisted and written to `localStorage`
  on every `timeupdate` (~4×/s). Last session's position is rendered until the
  audio element reports time.
- **Duplicated effect:** the audio `play`/`pause` listener effect in
  `player.tsx` is registered twice.

## Root causes

| #   | Cause                                                              | Location                                                                      |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1   | Selected reciter is not readable until a post-paint storage effect | `src/jotai/create-atom-with-storage.ts`, `src/jotai/atom.ts`                  |
| 2   | Home redirect gated on the catalog request                         | `src/app/page.tsx`                                                            |
| 3   | Loading fallback height ≠ player card height                       | `src/app/reciter/[id]/reciter-page.tsx`, `src/components/simple-skeleton.tsx` |
| 4   | Controls render an empty skeleton on the first client render       | `src/components/player-controls.tsx`                                          |
| 5   | Visualizer renders `null`, then a 72px block                       | `src/components/audio-bars-visualizer.tsx`                                    |
| 6   | Playback position persisted and written at 4 Hz                    | `src/jotai/atom.ts`, `src/components/player.tsx`                              |
| 7   | Duplicate audio listener effect                                    | `src/components/player.tsx`                                                   |

## Required behaviour

- With a reciter in `localStorage`, loading `/` opens that reciter's player
  without waiting for `/api/reciters`. The catalog is only used later to
  correct a stale selection.
- A stored reciter is available on the first client read of the atom.
- The loading state reserves the player card's final height, including the
  72px visualizer slot, so the card does not move when it mounts.
- The visualizer slot keeps its height before the first play and for non-CORS
  providers; no fake animation is drawn.
- The controls never render an empty placeholder in normal use.
- Playback position starts at `0` on every load and is not written to
  `localStorage`.
- The audio `play`/`pause` listeners are registered exactly once.

## Non-goals

- Server-rendering the player card from a cookie (deeper alternative, not in
  this plan).
- Redesigning the player, the skeleton, or the visualizer.
- Changing provider/catalog logic or the offline download pipeline.

## Acceptance

- `tests/player-first-load.spec.ts` passes: a stored reciter opens its player
  with `/api/reciters` blocked, and cold-load CLS stays below 0.05.
- Existing unit tests and `yarn lint` / `yarn type-check` pass.
- No new dependencies.
