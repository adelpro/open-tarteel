# Open Tarteel Consolidated Plan (2026-11-10)

> **For the maintainer:** this is a decision document, not a task transcript. Every
> source plan is listed with its real state; each remaining item has a
> **KEEP / CLOSE / IGNORE / EXTERNAL** recommendation. Tick the tasks you want;
> delete or ignore the rest. No code is executed from this file until you approve it.

**Goal:** replace four overlapping plans with one accurate backlog: close what is
already shipped, finish the two genuine gaps, and decide the fate of the branch
cleanup and the release.

**Sources consolidated:**

| Source | What it was | Real state (2026-11-10) |
| --- | --- | --- |
| `docs/superpowers/plans/2026-11-09-seo.md` | 12-task SEO implementation | **Code shipped**, 0/60 boxes ticked. All files and tests exist; `reciter-seo.tsx` was deliberately removed later (`7d3be32`). Only manual Search Console + a live audit run remain. |
| `docs/superpowers/plans/2026-11-10-player-first-load.md` | 7-task player first-load fix | **Code shipped**, 0/47 boxes ticked. All tasks implemented; the home-redirect logic moved to `src/app/home-client.tsx` during the SEO refactor and Task 2's planned `page.test.tsx` was never created. |
| `docs/ROADMAP.md` | 11-stage hardening/provider roadmap | Stages 0–11 marked complete. The "remaining" notes are mostly stale: the list/detail split, presets and the contract suite are all in the tree. True remainder: Cloudflare CNAME (external) and optional per-provider micro-optimizations. |
| `docs/redesign-plan.md` | 6-phase UI redesign | Phases **0–5 implemented with screenshots** in `docs/previews/phase-0…5`; Phase 6 (final QA contact sheet + `DESIGN.md` sign-off) is the only gap. Header still says "Phases 1–2 implemented". |
| `docs/superpowers/specs/*` | SEO + player designs | Implemented; keep as reference, no work. |

**Verified baseline (on `develop`, `dd86b8d`):**

| Check | Result |
| --- | --- |
| `tsc --noemit` | pass |
| `eslint . --max-warnings=0` | pass |
| `vitest --run` | 426 passed, 6 skipped (40 files) |
| `origin/develop` | up to date with local `develop` (3 commits pushed today) |
| Open PRs | none (`gh pr list --state open` → empty) |

**Global constraints:** no new dependencies; Conventional Commits; keep RTL/LTR,
light/dark and all three palettes unchanged; production deploys only from `main`
with the build guard in `netlify.toml`; do not tag before the deploy is verified.

---

## Branch map and recommendation

Current: `develop` = `origin/develop` = `dd86b8d`.

| Branch | Unique commits | Recommendation |
| --- | --- | --- |
| `fix/netlify-build-quota` (local) | 1 — `b0326e5` netlify `ignore` guard + docs | **MERGE to develop (ff), then delete.** It is the code half of the quota fix already documented by `12de72f`. |
| `origin/fix/yarn-v4-ci-corepack` | 3, 268 behind | **DELETE.** Corepack is already enabled in `.github/workflows/ci.yml` (lines 48, 79, 96); the merge commit is noise. |
| `origin/int-error-fix` | 1, 372 behind (Aug 2025) | **DELETE.** It resurrects an obsolete `src/app/[locales]/` tree; current i18n uses middleware + `/en`, `/de`. |
| `main`, `staging`, `develop`, `origin/{main,staging,develop}` | — | **KEEP** (environment/release branches). |
| 13 merged local branches (below) | 0 | **DELETE** after the netlify merge. |
| 27 merged remote branches (below) | 0 | **DELETE** after confirming no open PRs (currently none). |

Commands (run after approving this section):

```bash
# 1. the one branch worth merging
git switch develop
git merge --ff-only fix/netlify-build-quota
git push origin develop
git branch -d fix/netlify-build-quota

# 2. obsolete unmerged branches
git push origin --delete fix/yarn-v4-ci-corepack int-error-fix

# 3. obsolete local branches (safe: -d refuses unmerged)
git branch -d chore/dead-code-cleanup chore/production-hardening \
  docs/staging-hostname docs/staging-site-cname \
  feat/phase-2-player feat/phase-2c-ui feat/phase-3-capabilities feat/seo \
  fix/provider-localization fix/spectrum-first-play phase4-5 phase6 \
  test/offline-cold-start

# 4. merged remote branches (no open PRs)
git push origin --delete b0.2.2 better-ui better-ux \
  chore/dead-code-cleanup chore/production-hardening \
  docs/designmd-v2 docs/staging-hostname docs/staging-site-cname \
  feat/phase-2-player feat/phase-2c-ui feat/seo \
  fix/network-status-hydration fix/provider-localization fix/spectrum-first-play \
  int-hydration intl-contact multi-language multi-language-error \
  phase3 phase4-5 phase6 pr-47 pr-83 pr-88 redirect sound-control \
  views-count visualizer
```

---

## Decisions — what to keep, close, or ignore

| # | Item | Source | State | Recommendation | Effort |
| --- | --- | --- | --- | --- | --- |
| D1 | Tick/annotate the SEO plan so it stops reading as 0% | SEO plan | 12/12 tasks shipped | **CLOSE** (docs only) | 15 min |
| D2 | Tick/annotate the player plan | Player plan | 7/7 shipped | **CLOSE** (docs only) | 15 min |
| D3 | Missing home-redirect unit test | Player plan T2 | Logic in `home-client.tsx`, no unit test | **KEEP** — add one test file | 30–45 min |
| D4 | Run the 5 Playwright regressions once and record the result | Both plans | Files exist, never recorded | **KEEP** — one run | 15 min |
| D5 | Merge + delete branches | Today's audit | see table above | **KEEP** | 10 min |
| D6 | Promote `develop → main`, deploy, tag `0.5.0-rc.6` | `docs/DEPLOY.md` | Deploy blocked until quota resets | **KEEP, but only after the quota resets** | 30 min + wait |
| D7 | Redesign Phase 6: final contact sheet + `DESIGN.md` lint/sign-off | `redesign-plan.md` | Phases 0–5 done, screenshots committed | **KEEP (small)** or close as accepted | 1–2 h |
| D8 | Tahfeez settings persistence per reciter | ROADMAP Stage 6 P2 | Presets exist; settings are component state | **OPTIONAL — ignore unless users ask** | 3–4 h |
| D9 | Provider micro-optimizations (v3 CDN host, v4 `If-None-Match`/`mp3_64`, Qurani probe cache) | ROADMAP backlog | Catalog already lazy; payload still 183–234 KB | **DEFER** until measured against a target | 1–2 days |
| D10 | Cloudflare CNAME for `staging-tarteel.quran.us.kg` + Netlify TLS | ROADMAP 8c | Blocked: no dashboard/API creds | **EXTERNAL** | 20 min manual |
| D11 | Submit `sitemap.xml` to Search Console | SEO plan T12 | Runbook written in `docs/SEO.md` | **EXTERNAL** | 10 min manual |
| D12 | "List/detail split for MP3Quran + Qurani.ai" | ROADMAP line 565 | **Already done** — every adapter returns `playlist: []`, `getReciterPlaylist` is lazy | **IGNORE (stale)** | — |
| D13 | "5h opt-in live contract suite" | ROADMAP line 490 | **Already done** — `provider-contracts.yml` + `contracts.test.ts` + `test:contract` | **IGNORE (stale)** | — |
| D14 | Tahfeez presets / one-ayah repeat / 2×2 grid | ROADMAP Stage 10d | **Already done** — `tahfeez-mode-controls.tsx` | **IGNORE (stale)** | — |
| D15 | Redesign phases 0–5 | `redesign-plan.md` | **Already done** — primitives, action sheet, offline strip, settings, 39 screenshots | **IGNORE (stale status line)** | — |
| D16 | SEO + player implementation code | Both plans | **Already shipped and green** | **IGNORE (done)** | — |
| D17 | Run the Modern Web Guidance audit across the UI | user request | Never run (`modern-web-guidance` skill not used in this repo) | **KEEP** — audit-only, findings before fixes | 2–4 h |

---

## Tasks (only the KEEP items)

### Task 1: Close the two implementation plans (D1, D2)

**Files:** modify `docs/superpowers/plans/2026-11-09-seo.md`,
`docs/superpowers/plans/2026-11-10-player-first-load.md`.

- [ ] Add a status block under each title: `Status: implemented on develop (2026-11-10); code complete, unit + E2E coverage present.`
- [ ] Tick Tasks 1–10 and 12 in the SEO plan; leave Task 11 unticked with `Blocked: needs a deployed URL (run docs/DEPLOY.md first)` and Task 12 with `Runbook written; Search Console submission is manual (D11)`.
- [ ] Add a deviation note to SEO Task 7: `reciter-seo.tsx was removed in 7d3be32; page.tsx now owns metadata and SSR.`
- [ ] Tick player Tasks 1, 3–7; leave Task 2 unticked until Task 2 below lands, with `Redirect lives in src/app/home-client.tsx after the SEO refactor (f07e171); unit test pending.`
- [ ] Commit: `docs(plans): record the implemented status of the seo and player plans`

### Task 2: Add the missing home-redirect regression test (D3)

**Files:** create `src/app/home-client.test.tsx`.

**Cases (mock `next/navigation`, `@/hooks/use-reciters`, and `window.location.replace`):**

- [ ] Stored valid reciter + loaded catalog → `window.location.replace` called once with the reciter route (`/reciter/<id>?moshafId=<moshaf>`).
- [ ] Stored reciter whose `moshafId` is not in the catalog → selection cleared, `replace` not called, no loop.
- [ ] Corrupt `selected-reciter` JSON → renders without throwing and starts with no selection.
- [ ] Run `npx vitest --run src/app/home-client.test.tsx` → PASS.
- [ ] Commit: `test(home): pin the stored-reciter redirect`

### Task 3: Run the browser regressions once (D4)

- [ ] `npx next build`
- [ ] `npx playwright test tests/player-first-load.spec.ts tests/seo.spec.ts tests/home-seo.spec.ts tests/reciter-seo.spec.ts tests/sitemap.spec.ts`
- [ ] Expected: all pass. If a spec fails, record it here as a new task instead of silently retrying.
- [ ] Append the run date + result to both plans' status blocks.

### Task 4: Branch and release hygiene (D5)

- [ ] Run the four command blocks in **Branch map** above.
- [ ] Confirm `git branch -a` shows only `main`, `staging`, `develop` (+ remotes) and `git status -sb` is clean.
- [ ] `git remote prune origin`.

### Task 5: Release the quota fix (D6)

Only after Netlify's build-minute quota resets and the dashboard steps in
`docs/DEPLOY.md` → "When the build-minute quota resets" are done.

- [ ] `git switch main && git merge --ff-only develop && git push origin main`
- [ ] Verify: `/api/health` version, `/sw.js` `Cache-Control: no-cache`, `/sitemap.xml`.
- [ ] Tag `0.5.0-rc.6` (no `v`) only after the deploy is verified.
- [ ] Confirm the `Release from Tag` workflow produced the notes from `CHANGELOG.md`.

### Task 6: Redesign Phase 6 close-out (D7) — optional

- [ ] Capture the final contact sheet into `docs/previews/phase-6/`.
- [ ] Run `designmd_lint` on `DESIGN.md`; fix only lint findings.
- [ ] Update `docs/redesign-plan.md` status to `complete (2026-11-10)` and remove the "awaiting validation" line.
- [ ] Commit: `docs(design): close the redesign plan`

### Task 7: Run the Modern Web Guidance audit (D17)

**Goal:** map every user-facing surface to Google's Modern Web Guidance
(`modern-web-guidance` skill) and produce one findings document. **Audit only —
no code changes in this task**; each P0/P1 gap becomes its own follow-up task.

**Files:** create `docs/reviews/2026-11-10-modern-web-guidance.md`.

**Interfaces:** consumes the running app (`yarn dev` or the standalone build);
produces a table of `Surface | Guide id | Requirement | Current code | Gap |
Priority | Effort`, plus a list of follow-up tasks for the P0/P1 rows.

- [ ] Inventory the surfaces to audit: home/hero, reciter picker sheet (mobile +
      desktop dock), player card, playback controls, volume/mute, Tahfeez
      controls, settings page + palette picker, language switcher, offline strip,
      action sheet, error/404, PWA install/update prompts.
- [ ] Run **one search per capability** (2–5 words, no `React`/`Tailwind`/app
      nouns) and keep the exact query in the report:

  | Surface | Query |
  | --- | --- |
  | Reciter sheet, action sheet | `light dismiss dialog` |
  | `⋯` menu, language menu | `native popover menu` |
  | Settings form | `accessible form validation` |
  | Theme + palettes | `dark mode color scheme` |
  | Player motion | `reduced motion animation` |
  | Route changes | `view transitions navigation` |
  | Audio playback | `media session controls` |
  | PWA install/update | `pwa install prompt` |
  | Offline behaviour | `background sync offline` |
  | Long reciter list | `virtualize long list` |
  | Touch devices | `sticky hover touch` |
  | Keyboard users | `focus visible styles` |
  | Reciter artwork | `responsive images` |
  | Arabic/English layout | `rtl logical properties` |

  ```bash
  npx -y modern-web-guidance@latest search "<query>" --skill-version 2026_10_30-58d055df
  ```

- [ ] If a search returns nothing relevant, run `list` once; if the topic is
      truly absent, record `not covered` and move on — do not force unrelated
      guides.
- [ ] `retrieve` every matched id **plus** the discipline guide that applies
      (`accessibility`, `color`, `css`, `forms`, `html`, `performance`,
      `security`). If `retrieve` writes a temp file (>9.5 KB), read it in full.
- [ ] For each guide, record the requirement, the current implementation
      (`file:line`), the gap, and a priority:
      **P0** broken for users (a11y/security/data), **P1** Baseline violation,
      **P2** missing modern API with a working fallback, **P3** polish.
- [ ] Mark compliant items `compliant` with the `file:line` evidence — do not
      invent gaps to make the report look useful.
- [ ] Note the browser-support assumption used for fallback decisions
      (default: Baseline Widely available; the offline/PWA path is the hard
      requirement).
- [ ] Add a "Follow-up tasks" section: one line per P0/P1, each with the guide
      id and the file it touches. Do not implement them here.
- [ ] Run `npx tsc --noemit` and `npx vitest --run` to confirm the audit changed
      nothing.
- [ ] Commit: `docs(review): add the modern web guidance audit`

**Done when:** the report exists, every audited surface is either `compliant`
with evidence or listed as a gap with a priority, and the follow-up list is
ready to be scheduled.

---

## Deliberately ignored (with reasons)

- **D12 list/detail split** — already implemented for all five providers; the
  ROADMAP line is a leftover. Re-open only if `/api/reciters` grows past its
  current 183–234 KB.
- **D13 live contract suite** — `provider-contracts.yml` runs weekly and
  `test:contract` exists; nothing to add.
- **D14 Tahfeez presets** — shipped in `tahfeez-mode-controls.tsx`.
- **D15 redesign phases 0–5** — shipped, with screenshots per phase.
- **D16 SEO/player code** — shipped and green; only the paperwork and one test
  remain.

## Open questions for you

1. Approve **Task 4** (merge `fix/netlify-build-quota` + delete it, 13 merged local branches, and 28 merged remote branches)?
2. Keep **D8** (per-reciter Tahfeez persistence) or drop it?
3. Run **D7** (redesign Phase 6) or accept the current UI as final?
4. Anything in **D9** (provider perf) worth measuring before the next release?
5. Who does the two external items (**D10** Cloudflare CNAME, **D11** Search Console)?
6. Should **D17** (Modern Web Guidance audit) run before the release, or right after it? Any surface to leave out?
