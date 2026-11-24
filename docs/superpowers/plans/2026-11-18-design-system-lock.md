# Design System Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `DESIGN.md` authoritative and enforceable in code, then rebuild the player, spectrum, reciter list, filters, tags, follow-along and app shell against it.

**Architecture:** Seven sequential tasks. Task 1 locks the written spec with the design.md tools. Task 2 removes every parallel system (brand ramp, ambient orbs, framework palettes, unloaded weights, `transition-all`) and adds the missing token groups. Task 3 extracts one focus ring, one Tag, one Segmented, one overlay. Tasks 4-6 rebuild the named surfaces on those primitives. Task 7 is the verification gate. Each task is one commit on `develop`.

**Tech Stack:** Next 15.4, React 19, Tailwind 3.4 (config in `tailwind.config.ts`), Vite/vitest for unit tests, `@playwright/test` and direct `playwright` import from `/home/adelpro/gstack/node_modules/playwright/index.mjs` for browser verification, impeccable 0.1.3 via `gstack-design-detect.ts` for design regression.

**Spec:** `docs/superpowers/specs/2026-11-18-design-system-lock-design.md` and `DESIGN.md`

## Global Constraints

- Tailwind stays at `^3.4.1`; configure in `tailwind.config.ts`, no CSS-in-JS migration.
- Three palettes (`classic`, `warm`, `night`) × light/dark stay. `warm` is default. No fourth palette and no component branching on palette name.
- Arabic is primary; use logical properties (`ms-`, `me-`, `start-`, `end-`, `border-s`). No letter-spacing on Arabic.
- Tajawal weights are 400, 700, 900 only. Amiri (loaded face) for scripture only. Minimum text size 12px.
- Every touch target >= 44px. Focus is `ring-2 ring-primary/35 ring-offset-2 ring-offset-background`.
- Motion durations 120/180/240ms with `cubic-bezier(0.2, 0, 0, 1)`. No looping decoration, no `transition: all`, no layout-property animation.
- Flat surfaces, 1px `border-border`, no card shadows. One action hue and one mark hue per palette.
- One commit per task. No push or PR until asked.
- Verification target is a local `next dev` on `localhost:3000` running `develop`; staging is baseline evidence only.

## Review Focus

- **Arabic RTL with long reciter names:** a 64px row must not wrap into five lines or clip. Test in Task 5.
- **375px mobile:** no horizontal scroll, all five footer links reachable, player visible in first viewport. Test in Task 6.
- **Three palettes × two modes:** no retired blue, no hardcoded hex, no orbs in any combination. Test in Task 2 and Task 7.
- **`prefers-reduced-motion: reduce`:** all looping and entrance motion removed, progress fill kept. Test in Task 2 and Task 7.
- **Scripture font fallback:** ayah text renders real glyphs in every locale, not tofu boxes. Test in Task 4.

---

### Task 1: Lock the written spec

**Files:**

- Modify: `DESIGN.md`
- Create: `docs/superpowers/decisions/2026-11-18-detector-waivers.md`

**Interfaces:**

- Consumes: current `DESIGN.md`; authoring guide from `designmd_get_authoring_guide`.
- Produces: a lint-clean `DESIGN.md`; a recorded list of detector rules that are waived for this project and why.

- [ ] **Step 1: Capture the baseline**

Run the gstack format check and record output:
`bun --no-env-file --config=/dev/null run ~/.claude/skills/gstack/bin/gstack-design-md.ts check DESIGN.md`
Expected: `DESIGN_MD_FORMAT: spec`, `DESIGN_MD_MARKER: none`.

- [ ] **Step 2: Add the missing enforcement prose**

In `DESIGN.md`, add one section "Enforcement" and extend "Do's and Don'ts" with the exact rules the audit proved were missing: no `brand-*` hex or Tailwind default palette classes in components; no ambient orbs or `blur-[Npx]` decoration; no `transition-all`; no font weights 500/600; no `text-[10px]`; one Tag primitive, one overlay primitive, one focus ring; spectrum reads CSS variables only. Keep the existing token block unchanged.

- [ ] **Step 3: Verify token values did not regress**

Use `designmd_diff` with `before` = the original file text and `after` = the edited file text. Expected: `regression: false`, empty `tokens.*.modified`.

- [ ] **Step 4: Lint the edited file**

Use `designmd_lint` with `content` = edited file. Expected: 0 errors, 0 warnings. Fix any orphaned-token warning by referencing the token from a component rule rather than deleting the token.

- [ ] **Step 5: Record waivers**

Write `docs/superpowers/decisions/2026-11-18-detector-waivers.md` listing `cream-palette` (waived: explicit warm canvas token) and `gpt-thin-border-wide-shadow` (waived when computed `boxShadow` does not reproduce it).

- [ ] **Step 6: Commit**

`git add DESIGN.md docs/superpowers/decisions/2026-11-18-detector-waivers.md && git commit -m "design: lock DESIGN.md as the authoritative system"`

---

### Task 2: Remove the parallel systems and add missing tokens

**Files:**

- Modify: `tailwind.config.ts`, `src/app/globals.css`, `src/components/root-shell.tsx`
- Search-and-replace across: `src/components/pages/contact-page.tsx`, `src/components/not-found-view.tsx`, `src/components/error.tsx`, `src/components/playlist.tsx`, `src/components/pwa-updater.tsx`, `src/components/offline/retry-button.tsx`, `src/components/tooltip.tsx`, `src/components/dialog.tsx`, `src/components/skeleton.tsx`, `src/components/theme-picker.tsx`, `src/components/follow-along.module.css`, `src/components/pitch-contour.tsx`
- Test: `scripts/design-verify/tokens.mjs` (new)

**Interfaces:**

- Consumes: semantic aliases already in `tailwind.config.ts` (`primary`, `mark`, `surface`, `ink-muted`).
- Produces: `theme.spacing` 4px scale, `theme.fontWeight` {regular:400, bold:700, black:900}, `motion` token names; no `brand-*` colour keys.

- [ ] **Step 1: Write the failing browser assertion**

Create `scripts/design-verify/tokens.mjs`: launch Playwright (`chromium.launch({ headless: true })` imported from `/home/adelpro/gstack/node_modules/playwright/index.mjs`), open `http://localhost:3000`, and assert: (a) no element has a computed `backgroundImage` containing `blur(` in `root-shell`, (b) no computed `animationName === 'pulse'` outside a `motion-safe:` rule, (c) `document.fonts.check('28px Amiri')` is true, (d) `getComputedStyle(document.body).fontSize === '15px'`. Exit 1 on any failure.

- [ ] **Step 2: Run it to see it fail**

`node scripts/design-verify/tokens.mjs`
Expected: FAIL on (a), (b) and (d).

- [ ] **Step 3: Delete the ambient orbs**

In `src/components/root-shell.tsx`, remove the entire `<div className="ambient-orbs ...">` block including its three child divs. Do not replace it with another decorative layer.

- [ ] **Step 4: Remove the retired ramp and default palettes**

In `tailwind.config.ts`, delete the 13 `brand-*` colour keys. In every file listed above, replace `text-gray-*`, `bg-gray-*`, `text-zinc-*`, `bg-zinc-*`, `text-slate-*`, `bg-slate-*`, `sky-*`, `indigo-*`, `violet-*` and hardcoded hex with the semantic alias that matches its role. Where no role exists, add one to `DESIGN.md` and `globals.css` in the same commit rather than inventing a local hex.

- [ ] **Step 5: Add missing token groups**

In `tailwind.config.ts` add `theme.extend.spacing` with `xxs` 4px through `5xl` 64px exactly as in `DESIGN.md`, override `fontWeight` to only 400/700/900, and add `transitionDuration` 120/180/240 (already present, keep). Replace all `font-medium`/`font-semibold` with `font-bold`, and `transition-all` with the specific property utility.

- [ ] **Step 6: Fix body type**

In `src/app/globals.css`, set body font-size 15px and line-height 1.7; keep the existing Arabic no-letter-spacing rule.

- [ ] **Step 7: Run verification**

`node scripts/design-verify/tokens.mjs` → PASS. Then `yarn type-check && yarn lint && yarn test:run` → PASS.

- [ ] **Step 8: Commit**

`git add -A && git commit -m "design: remove parallel colour and type systems, add tokens"`

---

### Task 3: One focus ring, one Tag, one Segmented, one overlay

**Files:**

- Modify: `src/app/globals.css`, `src/components/ui/tag.tsx`, `src/components/ui/segmented.tsx`, `src/components/ui/action-sheet.tsx`, `src/components/sheet.tsx`, `src/components/reciter-filters.tsx`, `src/components/reciters-list.tsx`, `src/components/player-controls.tsx`
- Test: `scripts/design-verify/primitives.mjs` (new)

**Interfaces:**

- Consumes: `primary`, `surface-sunken`, `border` aliases from Task 2.
- Produces: `.focus-ring` utility class; `Tag` as the only chip; `Segmented` with 44px items; one overlay component with one scrim.

- [ ] **Step 1: Write failing assertions**

`scripts/design-verify/primitives.mjs`: at `/reciter/quran.foundation-13`, open the reciter sheet and assert (a) every `button` has a computed `outline-style !== 'none'` OR a `box-shadow` containing the primary ring colour when focused via `page.focus()`, (b) no interactive element has width or height < 44, (c) all chip-like elements use the same `borderRadius` value. Exit 1 on any failure.

- [ ] **Step 2: Run it, expect FAIL**

`node scripts/design-verify/primitives.mjs`

- [ ] **Step 3: Add the shared focus utility**

In `src/app/globals.css` add `@layer utilities { .focus-ring { @apply focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background; } }`. Apply it to every interactive element in the files above. Delete any `focus:outline-none`, `focus:ring-0` and conflicting `focus:ring-*` declarations.

- [ ] **Step 4: Consolidate chips**

Make `Tag` the only chip primitive. Replace the hand-rolled pills in `reciter-filters.tsx`, `reciters-list.tsx`, `player-controls.tsx` and `follow-along-panel.tsx` with `Tag`. Remove `rounded-full` from all of them; Tag corners are 8px.

- [ ] **Step 5: Consolidate Segmented and overlays**

Set `Segmented` item height to 44px. Make `reciter-filters.tsx`, `sheet.tsx`, `ui/action-sheet.tsx` and `dialog.tsx` share one scrim token and one header height (56px). Keep the mobile sheet / desktop popover split from `DESIGN.md`.

- [ ] **Step 6: Run verification**

`node scripts/design-verify/primitives.mjs` → PASS. `yarn type-check && yarn lint && yarn test:run` → PASS.

- [ ] **Step 7: Commit**

`git add -A && git commit -m "design: consolidate focus, tag, segmented and overlay primitives"`

---

### Task 4: Player, spectrum and scripture text

**Files:**

- Modify: `src/components/player.tsx`, `src/components/track-info.tsx`, `src/components/player-controls.tsx`, `src/components/audio-bars-visualizer.tsx`, `src/components/pitch-contour.tsx`, `src/components/follow-along.module.css`
- Test: `scripts/design-verify/player.mjs` (new)

**Interfaces:**

- Consumes: `.focus-ring`, `Tag`, tokens from Tasks 2-3.
- Produces: player order header → visualiser → seek → transport → metadata; spectrum reads CSS variables via `getComputedStyle`.

- [ ] **Step 1: Write failing assertions**

`scripts/design-verify/player.mjs`: at `/` and `/reciter/quran.foundation-13`, assert (a) the player card width is 512px at desktop, (b) transport has at most five children, (c) the ayah text element has a non-empty bounding box and its `fontFamily` resolves to a loaded face (`document.fonts.check()` on the computed family is true), (d) no `h-[210px]` wrapper around a taller child.

- [ ] **Step 2: Run it, expect FAIL**

- [ ] **Step 3: Fix scripture font**

In `src/components/follow-along.module.css`, change the font stack to the face actually loaded by `next/font` (Amiri, as declared in `root-shell.tsx`) with a local Arabic serif fallback. Add a unit test in `src/components/quran-line.test.tsx` asserting the rendered element's font-family does not contain `Amiri Quran` unless that face is registered.

- [ ] **Step 4: Fix player structure**

In `src/components/player.tsx`, set the column to `max-w-lg`, padding 16px, and order the children as now-playing header (surah 18/700, reciter 13 muted) → visualiser → seek → transport → one metadata line. Move shuffle and volume out of the transport row into the `⋯` sheet. Remove the `min-h-[210px]` wrapper.

- [ ] **Step 5: Unify spectrum colour sources**

In `src/components/pitch-contour.tsx`, replace the eight hardcoded rgba colours with values read from CSS variables using the same `getComputedStyle` pattern as `src/components/audio-bars-visualizer.tsx`. In `audio-bars-visualizer.tsx`, remove the off-system `duration-200` in favour of the 180ms token.

- [ ] **Step 6: Run verification**

`node scripts/design-verify/player.mjs` → PASS. `yarn type-check && yarn lint && yarn test:run` → PASS.

- [ ] **Step 7: Commit**

`git add -A && git commit -m "design: rebuild player and spectrum against tokens"`

---

### Task 5: Reciter list, riwaya filters and language

**Files:**

- Modify: `src/components/reciters-list.tsx`, `src/components/reciter-selector.tsx`, `src/components/reciter-filters.tsx`, `src/locales/ar.json`, `src/locales/en.json`, `src/locales/de.json`
- Test: `scripts/design-verify/reciter-list.mjs` (new), plus updates to any existing reciters-list unit test

**Interfaces:**

- Consumes: `Tag`, `Segmented`, `.focus-ring`.
- Produces: one-language labels per surface; reciter row limited to name + riwaya on the primary line.

- [ ] **Step 1: Write failing assertions**

`scripts/design-verify/reciter-list.mjs`: open the reciter sheet at 1440px and at 375px; assert (a) the sheet contains no English words when the locale is `ar` (`/All|Filters|Source|Riwaya|Show \d+ reciters/`), (b) no reciter button's text wraps to more than two visual lines, (c) filter and sort triggers are >= 44px.

- [ ] **Step 2: Run it, expect FAIL**

- [ ] **Step 3: Translate labels**

In `src/locales/ar.json`, replace the English scope and filter labels with Arabic messages; add equivalent keys to `en.json` and `de.json`. Source labels from messages, not literals in components.

- [ ] **Step 4: Reduce row density**

In `src/components/reciters-list.tsx`, keep name + riwaya on the primary line at 16px, moshaf at 13px muted, provider as plain text after `·`. Move provider/timing detail to the secondary line only at `lg`. Replace the existing `tnum` class with `tabular-nums`.

- [ ] **Step 5: Tighten filters**

In `reciter-filters.tsx`, keep Source and Riwaya as grouped checkbox rows separated by 1px rules. Use one `Segmented` for scope. Verify the `Filters` trigger uses `Tag`.

- [ ] **Step 6: Run verification**

`node scripts/design-verify/reciter-list.mjs` → PASS. `yarn type-check && yarn lint && yarn test:run` → PASS.

- [ ] **Step 7: Commit**

`git add -A && git commit -m "design: reduce reciter list density and localize filters"`

---

### Task 6: Follow-along, footer and mobile shell

**Files:**

- Modify: `src/components/follow-along-panel.tsx`, `src/components/follow-along.module.css`, `src/components/tajweed-legend.tsx`, `src/components/footer.tsx`, `src/components/footer-link.tsx`
- Test: `scripts/design-verify/shell.mjs` (new)

**Interfaces:**

- Consumes: `Tag`, motion tokens, focus ring.
- Produces: 12px minimum legend text; five footer links reachable at 375px; no third-party badge over the footer.

- [ ] **Step 1: Write failing assertions**

`scripts/design-verify/shell.mjs`: at 375px assert (a) `document.documentElement.scrollWidth === 375`, (b) all five footer links are visible and have >= 44px hit areas, (c) no element overlays the footer's bounding box, (d) follow-along legend computed font-size >= 12px.

- [ ] **Step 2: Run it, expect FAIL**

- [ ] **Step 3: Restyle follow-along**

In `follow-along.module.css` and `follow-along-panel.tsx`, replace the 140ms/160ms transitions and `font-weight: 600` with motion tokens and `font-bold`; raise `.legendItem` from 10px to 12px; replace the hardcoded `#332a18` with `var(--warm-ink)` (or the matching semantic variable). In `tajweed-legend.tsx`, render swatches with `Tag`.

- [ ] **Step 4: Fix the shell**

In `footer.tsx`, include the footer in normal flow and reserve its height on `<main>` so it cannot overlap the player or a docked sheet. At 375px use a compact layout that still exposes all five links. Remove or theme any notification badge that sits above the footer.

- [ ] **Step 5: Run verification**

`node scripts/design-verify/shell.mjs` → PASS. `yarn type-check && yarn lint && yarn test:run` → PASS.

- [ ] **Step 6: Commit**

`git add -A && git commit -m "design: restyle follow-along and fix mobile shell"`

---

### Task 7: Verification gate and regression report

**Files:**

- Create: `docs/superpowers/reports/2026-11-18-design-system-lock-verification.md`
- Modify: the audit report at `/home/adelpro/.gstack/projects/adelpro-open-tarteel/designs/design-audit-20261118/design-audit-staging-tarteel.quran.us.kg.md` (status lines only)

**Interfaces:**

- Consumes: all six `scripts/design-verify/*.mjs` assertions.
- Produces: a pass/fail table per finding and per viewport; detector delta.

- [ ] **Step 1: Run all local verification scripts**

`for f in scripts/design-verify/*.mjs; do node "$f" || exit 1; done`
Expected: all PASS at 1440px and 375px.

- [ ] **Step 2: Confirm FINDING-002 in a real browser**

If a display is available, launch Playwright headed with `headless: false` and screenshot the ayah line. If no display is available or glyphs still render as boxes, mark FINDING-002 `deferred` and do not claim it verified.

- [ ] **Step 3: Detector regression**

Dump the rendered DOM of the same eight pages into a fresh run directory, then:
`bun --no-env-file --config=/dev/null run ~/.claude/skills/gstack/bin/gstack-design-detect.ts scan --format gstack --host claude <new-dom-dir>`
Expected: `low-contrast`, `nested-cards`, `undersized-ui-text`, `pulsing-dot` and `image-hover-transform` counts drop to 0. `cream-palette` remains and is waived.

- [ ] **Step 4: Spec regression**

Use `designmd_diff` with before = baseline `DESIGN.md` from Task 1 and after = current file. Expected: `regression: false`.

- [ ] **Step 5: Write the report**

Create the verification report with a per-finding table (`FINDING-001` through `FINDING-010`), status verified/deferred, the command that proved it, and before/after screenshot paths. Update the six status lines in the audit report.

- [ ] **Step 6: Commit**

`git add docs/superpowers/reports/2026-11-18-design-system-lock-verification.md && git commit -m "design: record verification and detector regression"`

---

## Self-review

- Spec coverage: every goal in the design doc maps to Tasks 1-7; the five named surfaces each have a task; the tooling choices (designmd, Playwright) appear in Tasks 1, 2, 4 and 7.
- Review Focus: each of the five input classes has an assertion in the owning task.
- No new palette, framework migration, data/API change or push is introduced.
