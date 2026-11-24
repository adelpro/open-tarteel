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
That is why the mode lives in a shared atom, and why `follow-along` is no longer
one of its values:

```ts
export type PlayerMode = 'listening' | 'tahfeez';
export const playerModeAtom = atom<PlayerMode>('listening');
```

`PlayerControls` sets it from the mode switcher; `Player` reads it, plus the
setting and the provider gate, to decide whether to render the line:

```ts
isFollowAlongEnabled() &&
  followAlongLine &&
  activeMode === 'listening' &&
  followAlongBlockReason(source, moshaf, isOnline) === null;
```

The gate matters: without it, an unsupported reciter would sit under a permanent
"No word timings" line.

### The ahkam marks

`AhkamRail` is back, mounted inside the panel under the ayah line behind
`ahkamTagsAtom`. It draws one mark per word that carries a rule, in word order,
scaled up for the word being recited. Rule names are not repeated under every
word: the colour key maps colour to rule, and the name stays in the markup for
screen readers.

It reads rules from the bundled text, not from timings, so it appears even when
the provider's timings fell back to the ayah. Only the six sound groups are
listed (`AHKAM_GROUPS`); `hamzat_wasl`, `lam_shamsiyyah` and `silent` stay as
glyph styling, because they describe the writing rather than a sound.

The switch is disabled while the Quran line is off, because the marks annotate
that line and have nothing to sit under without it.

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
- `settings.followAlongAhkam`, `settings.followAlongAhkamDescription`

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
3. No follow-along row exists in the mode switcher.
4. Settings → Follow-along → Quran line off removes the line after a reload, with
   no mode row to fall back to.
5. Settings → Spectrum → Show spectrum off removes the graph and keeps the line.
6. Settings → Follow-along → Ahkam tags off removes the second row only.
7. The About page no longer claims a pitch contour.
