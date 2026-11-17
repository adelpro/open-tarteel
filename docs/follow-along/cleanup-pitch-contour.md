# Cleanup: delete the pitch contour

**Status: executed.** The contour is gone from the tree, along with `pitchy` and
the second analyser node. `knip` reports nothing unused. This page stays as the
record of what was removed and how it was verified, so a fork that still carries
the graph can follow the same steps.

The pitch contour is no longer rendered anywhere. It was hidden in the line-only
migration and its files are dead. This page is the removal list, verified against
the tree rather than remembered, plus the doc and dependency changes that go with
it.

## Verify it is still dead

Re-run these first. If any of them prints a path, the file has a consumer and
must not be deleted.

```bash
# 1. Who imports the component? Expect: nothing.
grep -rn "pitch-contour\|PitchContour" src --include=*.tsx --include=*.ts | grep -v "components/pitch-contour.tsx"

# 2. Who imports the pitch helpers? Expect: the contour and its own test only.
grep -rn "follow-along/pitch'" src

# 3. Who uses the pitch analyser? Expect: the contour only.
grep -rn "ensurePitchAnalyser\|getPitchAnalyser" src | grep -v "utils/audio-analyser.ts"

# 4. Is the dependency used anywhere else? Expect: no output.
grep -rn "from 'pitchy'" src
```

## Delete

In this order, checking `npx tsc --noemit` after each step:

| Step | Path                                                        | Why                                 |
| ---- | ----------------------------------------------------------- | ----------------------------------- |
| 1    | `src/components/pitch-contour.tsx`                          | The component; no importers         |
| 2    | `src/services/follow-along/pitch.ts`                        | Its helpers, including `voicedRuns` |
| 3    | `src/services/follow-along/pitch.test.ts`                   | Tests for the above                 |
| 4    | `.contour` rule in `src/components/follow-along.module.css` | Only the component used it          |
| 5    | `pitchy` in `package.json` (and `yarn.lock`)                | Only the contour imported it        |

```bash
rm src/components/pitch-contour.tsx \
   src/services/follow-along/pitch.ts \
   src/services/follow-along/pitch.test.ts
corepack yarn remove pitchy
```

Then delete the `.contour` block in `src/components/follow-along.module.css` by
hand (it is the last rule in the file).

## Edit, do not delete

`src/utils/audio-analyser.ts` is shared with the spectrum. Keep `ensureAnalyser`,
`getAnalyser` and the context helpers. Remove only the pitch half:

- `pitchAnalyser` module variable
- the `pitchAnalyser` creation inside `ensureNodes()`
- `source.connect(pitchAnalyser …)` in `connectSource()`
- `ensurePitchAnalyser()` and `getPitchAnalyser()`
- the header comment line explaining the 2048/0 split

The spectrum keeps working: it uses the 1024-bin analyser with smoothing.

## Documentation to correct

These describe a graph that no longer exists:

| File                                       | What                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `docs/follow-along/README.md`              | Already updated for line-only; re-read after any revert                                                        |
| `docs/follow-along/decisions.md`           | Delete D3, D15, D16 and D19. Keep D20, D21, D22                                                                |
| `docs/follow-along/implementation-plan.md` | Phase 4 line 52 (`pitch-contour.tsx`), line 74 (pitch node on close), lines 83 and 102 (archive the prototype) |
| `docs/follow-along/data-sources.md`        | The `pitchy` row in the libraries list                                                                         |

`docs/follow-along/migration-line-only.md` stays: it is the history of the
change, not a description of the code.

## What not to touch

- `TAJWEED_COLORS`, `TAJWEED_LABELS`, `ruleGroup` in `src/services/quran-text/rules.ts`
- `quran-line.tsx`, `tajweed-legend.tsx`, `follow-along-panel.tsx`
- `followAlongLineAtom` and the settings toggle
- the timing repair in `follow-along/index.ts` and `timings/word-timings.ts`

## Definition of done

```bash
npx tsc --noemit          # clean
npm run lint              # --max-warnings=0
npx vitest --run          # no failures
npm run knip              # no unused files, exports or dependencies
corepack yarn build       # production build, no missing module
```

`knip` is the real check here, but read it carefully: it reports unused files and
dependencies, and a file with a test is not unused. Measured on the tree after the
line-only migration, before any deletion:

```
Unused files (1)
src/components/pitch-contour.tsx
Unused dependencies (1)
pitchy  package.json:79:6
```

`src/services/follow-along/pitch.ts` is **not** listed, because
`pitch.test.ts` imports it. Delete the test and the helper in the same step or
knip will keep passing while the dead file stays. After the cleanup the same
command should print neither file nor the dependency.
