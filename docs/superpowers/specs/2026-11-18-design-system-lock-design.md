# Lock the design system before redoing the UI

**Date:** 2026-11-18
**Repo:** open-tarteel, branch `develop`
**Status:** design doc, awaiting approval. No implementation has been touched.

## Intent and why

The full design audit of `staging-tarteel.quran.us.kg` produced 10 findings (7 high, 3 medium), Design score C, AI-slop score C+. Every finding is a symptom of one cause: `DESIGN.md` describes a disciplined, fully tokenised system, but only a handful of newer components actually use it. The rest of the app runs on Tailwind default palettes, a retired `brand-*` blue ramp, ad-hoc pixel values, unloaded font weights (500/600), four parallel chip systems, four overlay primitives and two visualisers with different colour sources.

Patching the 10 findings in place would make the screenshots better and leave the underlying inconsistency intact. The next feature would reintroduce the same drift. The work therefore starts by making the written system authoritative and enforceable in code, then rebuilding the affected screens on top of it.

## Goals

1. `DESIGN.md` is valid under the design.md format linter and its prose assigns roles and boundaries, not just values. `designmd_diff` shows no token regression from the current file.
2. There is exactly one source for each recurring design role in code: colour, spacing, radius, focus ring, chip, overlay, motion duration, type weight.
3. The five areas the user called out (player, reciter list, spectrum, tags, follow-along, plus riwaya/source filters) are rebuilt against those primitives.
4. Information density in the reciter row and sheet is reduced; labels stay in one language per surface.
5. Every phase is verifiable with a Playwright script and a detector re-run, on desktop and 375px mobile.

## Non-goals

- No new palette, typeface or brand mark. Three palettes × two modes stay.
- No framework or styling migration; the project stays on its installed Tailwind major.
- No changes to recitation data, provider APIs, playback logic or routing.
- No new motion, shadows, gradients, or decorative illustration.

## Anti-goals

- Token-correct but decision-wrong UI: a value from `DESIGN.md` used in the wrong role (mark colour as a 12px text colour, primary as a background tint).
- A second chip/overlay/focus implementation "just for this screen".
- Fixing a rendered symptom without removing the code path that produces it.

## Constraints

- The `designmd-forge` container on port 9200 is not running on this machine. The `designmd` MCP tools (lint, diff, authoring guide) are available and are the forge-backed interface; use them. Record their output in the report.
- The in-app browser is macOS-only (Aside). Use Playwright directly, imported from `/home/adelpro/gstack/node_modules/playwright/index.mjs` in a plain Node script. The gstack `$B` wrapper needs `NODE_PATH` and `GSTACK_CHROMIUM_NO_SANDBOX=1`; direct import also allows `addInitScript` for layout observers. Set `BROWSE_SESSION` as an env var if `$B` is used at all.
- The staging site is deployed from the `staging` branch; the local checkout is on `develop` by user request. Visual verification targets `https://staging-tarteel.quran.us.kg`; source changes land on `develop` until merged.
- The scripture glyph issue (FINDING-002) must be confirmed in a real browser before being treated as shipped. The headless capture lacks a usable Arabic serif fallback.
- Work tree must stay clean; one commit per phase.

## Approaches considered

### A. Patch the 10 findings in place (rejected)

Fast and visually effective. Each finding is small on its own. Rejected because it leaves the half-migration intact: the next component still has four chip systems to choose from and no spacing tokens to use. It would trade a C score today for the same problems next month.

### B. Lock the system first, then rebuild the affected screens (chosen)

Spend one phase on the spec and the primitives that make it enforceable, then repair player, list, spectrum, tags, follow-along and filters on top. Slower to first visible change, but each later phase is smaller because the decisions are already made. This is the approach the user picked.

There is no third sensible approach. A full rewrite would exceed the audit's evidence and change behaviour the user did not ask to change.

## Decisions about the how

- **Spec tooling:** use the `designmd` MCP tools. `designmd_get_authoring_guide` for prose rules, `designmd_lint` on the edited `DESIGN.md`, `designmd_diff` against the current file to assert no token regression. The local gstack `gstack-design-md.ts check/tokens` remains the format check for the existing spec-style front matter.
- **Browser tooling:** Playwright direct import. Scripts live under `scripts/design-verify/`, capture desktop 1440 and mobile 375, and assert computed styles (font family, contrast, touch sizes, focus ring) rather than relying on screenshots alone.
- **Ordering:** spec and tokens first, then shared primitives, then the user-named screens, then the shell, then verification. Within a phase: type and colour, then hover/active/focus, then layout and spacing, then motion, then copy.
- **Evidence:** every phase ends with before/after screenshots, a Playwright assertion run, and a detector count. Findings are marked verified only when the assertion passes.
- **Merge behaviour:** each phase is one commit on `develop`; no push or PR until the user asks for it.

## Builder check resolutions

A fresh engineer read this doc before planning and asked seven questions. Resolutions:

1. **Verification target (my call):** run a local `next dev` from `develop` and verify at `localhost:3000` after each phase. Staging stays the baseline evidence only. Reason: fixes on `develop` are not on staging, so staging assertions could never see them.
2. **Audit report and detector (answered already):** full report at `/home/adelpro/.gstack/projects/adelpro-open-tarteel/designs/design-audit-20261118/design-audit-staging-tarteel.quran.us.kg.md` with FINDING-001 through FINDING-010. Detector is impeccable 0.1.3 via `gstack-design-detect.ts scan --format gstack --host claude <dom-dir>`; DOM mode, 8 page dumps, baseline counted 811.
3. **Follow-along scope (answered already):** the user named follow-along in the original complaint. This is a visual restyle against shared primitives, not a new feature and not an enablement of `NEXT_PUBLIC_ENABLE_FOLLOW_ALONG`.
4. **Real-browser confirmation (my call):** use Playwright headed if a display is available; otherwise confirm with Playwright plus a locally installed Arabic serif fallback, and defer FINDING-002 rather than claim it verified.
5. **Enforceable in code (my call):** shared primitives and token mapping only. No new ESLint rules in this work.
6. **i18n (my call):** reuse existing message keys where possible; any new key is added in `ar`, `en` and `de`.
7. **Spectrum colour (my call):** keep the `getComputedStyle` token-reading approach already used by `audio-bars-visualizer.tsx` and make `pitch-contour.tsx` read the same CSS variables. No new hue; no use of `mark` for data.

## What is left to the builder

The phase-by-phase plan (tasks, exact files, tests, verification commands) is a separate document produced by `writing-plans`. Choices genuinely open at implementation time: the exact Tailwind version in `package.json` (config file location), and whether the five footer links need a bottom-nav pattern at 375px or a compact overflow menu. Both are inspectable from the repo and do not change what gets built.
