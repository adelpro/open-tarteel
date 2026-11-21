# Design System Lock — verification report

Date: 2026-11-21
Branch: `develop`, plan commits `e8afc06` → final HEAD
Target: production build served locally on port 3100 (staging remains baseline evidence only)

## How verification ran

A production build (`corepack yarn build`) was served with `corepack yarn start -p 3100` under `nice -n 10` and `NODE_OPTIONS=--max-old-space-size=2048`. `scripts/design-verify/run-all.mjs` starts that server, waits on `/api/health`, runs all five assertion scripts, and stops the server in a `finally` block. No dev server is left running.

Commands and result:

```text
corepack yarn build                              BUILD_OK
node scripts/design-verify/run-all.mjs           tokens:PASS primitives:PASS player:PASS reciter-list:PASS shell:PASS
                                                 ALL VERIFICATION SCRIPTS PASSED
corepack yarn type-check                         PASS
corepack yarn lint                               PASS (0 warnings)
corepack yarn test:run                           516 passed, 6 skipped
```

## Per-finding status

| Finding | Status | Evidence |
|---|---|---|
| FINDING-001 ambient orbs + perpetual pulse | verified | `tokens.mjs` (a) no `.ambient-orbs`, no visible blur filter; (b) no non-motion-safe pulse. Orbs deleted in `root-shell.tsx`. |
| FINDING-002 scripture tofu | deferred | `player.mjs` (c) registers the `Amiri` FontFace and checks it with Arabic sample text; the final headless screenshot shows real glyphs, but no headed display was available for the Step 2 visual confirmation. |
| FINDING-003 footer/badge overlay | verified with deferral | `shell.mjs` (c) no overlay on footer, (g) no footer paint over docked sheet, (f) padding coupling guard. Dev badge removed via `next.config.ts`. The third-party "Powered by Notify" badge has no source in this repo; left as-is. |
| FINDING-004 reciter list overload | verified | `reciter-list.mjs` (a) no retired English labels at `ar`, (b) <=2 visual lines per row, (c) >=44px filter/sort triggers; three locale files updated. |
| FINDING-005 low-contrast 12px text | verified | Detector `low-contrast` 1 → 0. Warm light `--warning` darkened from `#a9690a` (3.7:1) to `#8a5608` (5.1:1 on warm surface-sunken). The BETA badge now uses `neutral` instead of `warning` tone. |
| FINDING-006 44px touch targets | verified with deferral | `primitives.mjs` (b) and (c), `reciter-list.mjs` (c), `shell.mjs` (b). Range-input hit areas are excluded from the measurement and remain a deferred minor. |
| FINDING-007 focus/active/disabled states | deferred | `primitives.mjs` (a) OR and (d) stricter check: all `[data-tag]`, Segmented items and touched buttons carry `.focus-ring` and resolve the primary ring in computed `box-shadow`. Active/disabled styling was not asserted exhaustively. |
| FINDING-008 type and motion scale | verified | Detector `undersized-ui-text` 24 → 0; `tokens.mjs` (d) body 15px/1.7; motion tokens 120/180/240 with standard easing applied in touched code. |
| FINDING-009 one Tag primitive | verified with deferral | `Tag` is the sole chip (`data-tag` hooks); four parallel chip systems removed. Detector `nested-cards` 2 remains in the reciter DOM; no element location is reported and the audited tree shows sibling surfaces, so it is deferred to the final review. |
| FINDING-010 mobile shell and transport | verified with deferral | `player.mjs` (b) exactly five visible controls (44/56/44/44/44), `shell.mjs` (a) scrollWidth 375. Skeleton shape was not restyled to the new player card. |

## Screenshots

Baseline (before, captured during the audit):
`/home/adelpro/.gstack/projects/adelpro-open-tarteel/designs/design-audit-20261118/screenshots/home2.jpg`,
`reciter2.jpg`, `settings.jpg`, `follow-along.jpg`, `mobile-home.jpg`, `mobile-reciter.jpg`, `selector.jpg`, `filters2.jpg` in the same directory.

Final (after, production build on port 3100, 1440px unless noted):
`.../screenshots/final-home.jpg`, `final-reciter.jpg`, `final-settings.jpg`, `final-follow-along.jpg`, `final-mobile.jpg` (375px) in the same directory.

No new "before" screenshots were captured: the baseline files above are the audit evidence, and the source state they show no longer exists.

## Detector regression

Same eight pages, rendered DOM dumped into an owner-only directory under the design-report allow-list, scanned with impeccable 0.1.3:

```text
baseline:  counted 811
final:     counted 472
by rule:   cream-palette 8, cramped-padding 462, nested-cards 2, low-contrast 0
rules gone: undersized-ui-text, pulsing-dot, image-hover-transform, gpt-thin-border-wide-shadow
```

- `cream-palette` 8: waived, the cream canvas is an explicit locked token.
- `cramped-padding` 462: collapsed into FINDING-004/FINDING-009. It is one repeated list-row pattern, already graded; not padded by new findings.
- `nested-cards` 2: deferred as described above.
- DOM dumps were deleted after the scan.

## Spec regression

`designmd` MCP became unavailable during this task. Verified with the gstack CLI fallback:

```text
gstack-design-md.ts check DESIGN.md  → DESIGN_MD_FORMAT: spec, DESIGN_MD_MARKER: none
gstack-design-md.ts tokens DESIGN.md → token map parses; no errors
```

`git diff e8afc06..HEAD -- DESIGN.md` shows one additive change only: the `scrim` colour token and its usage rule. No existing token value was modified. A `designmd_diff` re-run was not possible in this session; this is stated rather than implied.

## Summary

- Findings: 10 audited. 4 verified, 4 verified with a narrow deferral, 2 deferred (FINDING-002 headed visual check unavailable, FINDING-007 active/disabled states).
- Deferred details: third-party Notify badge, range-input hit measurement, active/disabled styling, `nested-cards` detector hits, skeleton shape.
- Design score: C → not re-graded; this report records verification, not a new audit.
- Detector: 811 → 472 counted.
- No push, no PR. Three unrelated untracked `docs/follow-along/article-ar-*.md` drafts were left untouched.
