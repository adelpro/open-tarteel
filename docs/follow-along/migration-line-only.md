# Migration: follow-along is the line only

The mode no longer draws pitch. It shows the word-synced line and its colour key
under the spectrum, and the spectrum is never hidden. This page maps what was
there before to what is there now, so an existing branch, fork or open PR can be
moved over without guessing.

Decided in [D21 and D22](decisions.md).

## For listeners

| Before                                        | Now                                            |
| --------------------------------------------- | ---------------------------------------------- |
| The spectrum disappeared in follow-along mode | It stays; the line sits under it               |
| A pitch curve drew in amber under the line    | Gone                                           |
| A row of rule chips tracked the words         | Gone                                           |
| A word lit 300 ms before its start            | It lights on its own start                     |
| No way to turn the line off                   | Settings → Follow-along → Text line, persisted |

With the line switched off, the follow-along row disappears from the mode
switcher instead of opening an empty panel. Nothing else about the player changes.

## For developers

### The atom

`followAlongActiveAtom` is gone. It existed only to hide the spectrum while the
mode was open, and it was never persisted.

```diff
- export const followAlongActiveAtom = atom(false);
+ export const followAlongLineAtom = createAtomWithStorage<boolean>(
+   'follow-along-line',
+   true
+ );
```

If your branch reads the old atom, delete the read. If it writes it to hide UI,
that intent no longer exists: the spectrum stays. To gate the mode itself, read
the new atom:

```ts
const showFollowAlong = isFollowAlongEnabled() && showFollowAlongLine;
```

### The panel

`FollowAlongPanel` renders `QuranLine` and `TajweedLegend`. It still takes
`audio`, because the word clock reads `audio.currentTime`; it no longer needs the
element for analysis.

It now mounts in `player.tsx`, above the spectrum, not inside `player-controls`.
That is why the mode lives in a shared atom:

```ts
export type PlayerMode = 'listening' | 'tahfeez' | 'follow-along';
export const playerModeAtom = atom<PlayerMode>('listening');
```

`PlayerControls` sets it from the mode switcher; `Player` reads it to decide
whether to render the line above the graph.

Removed from the panel:

- `<PitchContour audio={audio} marks={marks} />` and the `marks` memo that fed it.
- `<AhkamRail rules={ahkam} … />` and the `ahkam` memo.
- `src/components/ahkam-rail.tsx`, `src/services/follow-along/ahkam.ts` and their
  tests are deleted, not parked.

### The clock

```diff
- export const WORD_ANTICIPATION_MS = 300;
+ export const WORD_ANTICIPATION_MS = 0;
```

The 300 ms lead made the text read as running ahead of the reciter. The constant
stays as the tuning knob for a provider whose timings land late.

### Settings

Two switches, deliberately separate, both `createAtomWithStorage`:

| Switch        | Atom                  | Storage key         | Group        |
| ------------- | --------------------- | ------------------- | ------------ |
| Show spectrum | `spectrumEnabledAtom` | `spectrum-enabled`  | Spectrum     |
| Quran line    | `followAlongLineAtom` | `follow-along-line` | Follow-along |

New message ids in `src/app/(ar)/settings/page.tsx`:

- `settings.spectrumShow`, `settings.spectrumShowDescription`
- `settings.followAlong`, `settings.followAlongDescription`
- `settings.followAlongLine`, `settings.followAlongLineOn`,
  `settings.followAlongLineOff`

All three locales (`ar`, `en`, `de`) carry the keys. Storage key is
`follow-along-line`; an existing user has no value and gets the default (`true`),
so nothing needs backfilling.

### About copy

The About page described a contour computed with pitchy. That paragraph and the
title are rewritten in `follow-along-about.tsx` and the three locale files, and
the copy now states that the mode does not record or compare your voice.

## Rollback

Two levels, pick by what you need:

```bash
# Whole mode off, no deploy of code changes
NEXT_PUBLIC_ENABLE_FOLLOW_ALONG=false

# Restore the graph and the rail, keeping this history
git revert <line-only-sha>
```

Reverting the line-only commit brings back the pitch curve; note that the
silence-gap fix and the on-time highlight live in earlier commits and would need
to be re-applied or reverted separately.

## Verification

```bash
npx tsc --noemit
npm run lint
npx vitest --run
```

Then check by hand, in a word-timing recitation (e.g. Quran Foundation moshaf 4):

1. The line renders above the spectrum, and the spectrum keeps playing.
2. The word lights at the start of its own audio, not before it.
3. Settings → Follow-along → Quran line off removes the mode row after a reload.
4. Settings → Spectrum → Show spectrum off removes the graph and keeps the line.
5. The About page no longer claims a pitch contour.
