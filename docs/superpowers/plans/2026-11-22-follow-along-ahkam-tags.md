# Follow-along ahkam tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the primitive ahkam chips and dot rail with a typographic rule key, move follow-along visibility to the More menu, and leave only the ahkam-tag switch in Settings.

**Architecture:** Create one focused `AhkamRuleKey` component that renders label + colored underline rows and highlights every rule group found on the current word. Remove `AhkamRail` entirely. `followAlongLineAtom` stays the single source for follow-along visibility; `ahkamTagsAtom` gates only the rule key.

**Tech Stack:** Next 15, React 19, Tailwind 3.4, react-intl, Jotai, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-22-follow-along-ahkam-tags-design.md`

## Global Constraints

- Arabic first, RTL with logical properties.
- Minimum 12px text; no `rounded-full` circles or chip/box chrome.
- Active state uses bold + thicker underline, never color alone.
- Existing Tajweed colors only; no new hues.
- Flat, hairline separation, 120/180ms motion with standard easing.
- One commit per task; no push or PR unless asked.

## Review Focus

- Multi-rule word: every rule group found on the current word is highlighted, not just the first — covered by Task 1 unit test.
- Tags-off state: with `ahkamTagsAtom` false, the panel shows only the Quran line — covered by Task 2 browser check.
- More-menu toggle: `followAlongLineAtom` drives visibility from the More menu — covered by Task 3 browser check.
- Settings no longer controls follow-along visibility, only tags — covered by Task 3 code check.
- RTL and 375px wrap: labels remain readable and no horizontal scroll — covered by Task 4 browser check.

---

### Task 1: Ahkam rule key

**Files:**
- Create: `src/components/ahkam-rule-key.tsx`
- Test: `src/services/quran-text/rules.test.ts`
- Modify: `src/services/quran-text/rules.ts`
- Modify: `src/components/follow-along-panel.tsx`
- Delete: `src/components/ahkam-rail.tsx`

**Interfaces:**
- Consumes: `ruleGroup(rule)`, `TAJWEED_COLORS`, `TAJWEED_LABELS`, `TAJWEED_GROUP_ORDER`, `TajweedGroup`.
- Produces: `ruleGroupsForWord(chars: { rule?: string | null }[]): Set<TajweedGroup>`; `AhkamRuleKey({ activeGroups, locale })`.

- [ ] **Step 1: Write the failing test for `ruleGroupsForWord`**

```ts
it('returns every rule group on a word', () => {
  expect(ruleGroupsForWord([{ rule: 'madd' }, { rule: 'ghunnah' }, { rule: 'madd' }]))
    .toEqual(new Set<TajweedGroup>(['madd', 'ghunnah']));
});
```

- [ ] **Step 2: Run the test and confirm it fails because the helper is missing**

- [ ] **Step 3: Add `ruleGroupsForWord` to `src/services/quran-text/rules.ts`**

Use `ruleGroup` on each character and collect non-null groups into a `Set`, preserving the project's group names.

- [ ] **Step 4: Run the test and confirm it passes**

- [ ] **Step 5: Create `AhkamRuleKey`**

Render `TAJWEED_GROUP_ORDER` as `<ul><li>`: label in `text-xs text-ink-muted`, 2px bottom border in `TAJWEED_COLORS[group]` via inline style. Active items get `font-bold text-ink`, a 3px underline, and `aria-current="true"`. No circles, pills, backgrounds or shadow.

- [ ] **Step 6: Wire the panel**

Remove `AhkamRail` import, its `ahkam` useMemo, and its render. Import `AhkamRuleKey`; replace `TajweedLegend` render with `<AhkamRuleKey activeGroups={ruleGroupsForWord(currentWord.chars)} locale={...} />`, gated by `ahkamTagsAtom`, with `mt-2` spacing.

- [ ] **Step 7: Verify**

`corepack yarn vitest --run`, `corepack yarn type-check`, `corepack yarn lint`; confirm no `AhkamRail` references remain.

- [ ] **Step 8: Commit**

`git add -A && git commit -m "feat: typographic ahkam rule key"`

### Task 2: More-menu follow-along toggle

**Files:**
- Modify: `src/components/player-controls.tsx`
- Modify: `src/locales/{ar,en,de}.json`

**Interfaces:**
- Consumes: `followAlongLineAtom` from `src/jotai/atom.ts`, existing `MenuRow`.
- Produces: one More-menu row that toggles follow-along visibility.

- [ ] **Step 1: Add the locale key**

`player.followAlong` = "Follow-along line" / "سطر التلاوة" / "Rezitationszeile" in the three locale files.

- [ ] **Step 2: Add the row**

In the More sheet, after the existing playback-mode rows, render one `MenuRow` with `pressed={followAlongLine}` and `onClick` toggling `followAlongLineAtom`. It is independent of `playerModeAtom`.

- [ ] **Step 3: Verify**

Run type-check, lint, and a browser check that toggling the row shows/hides the follow-along line while `ahkamTagsAtom` remains unchanged.

- [ ] **Step 4: Commit**

`git add -A && git commit -m "feat: toggle follow-along from More menu"`

### Task 3: Simplify Settings

**Files:**
- Modify: `src/app/(ar)/settings/page.tsx`

**Interfaces:**
- Consumes: `ahkamTagsAtom`.
- Produces: settings group with exactly one switch.

- [ ] **Step 1: Remove follow-along visibility controls**

Delete the `followAlongLineAtom` row, its state, the availability disclosure, and now-unused imports/state (`FiInfo`, `showAvailability`, `followAlongLineAtom`).

- [ ] **Step 2: Keep only the ahkam-tags switch**

Keep the group title and one Row/Switch bound to `ahkamTagsAtom`, with its existing description.

- [ ] **Step 3: Verify**

Type-check, lint, browser check that no follow-along visibility switch remains in Settings and the ahkam switch still persists.

- [ ] **Step 4: Commit**

`git add -A && git commit -m "design: keep only ahkam switch in settings"`

### Task 4: Verify and update the plan

**Files:**
- Modify: `docs/superpowers/plans/2026-11-22-follow-along-ahkam-tags.md`

- [ ] **Step 1: Browser verification**

At 1440px and 375px: no dots, no circles, labels wrap without horizontal scroll; tags off shows only the Quran line; multi-rule word highlights multiple labels.

- [ ] **Step 2: Update this plan**

Record actual files changed, commands run, and any deviations from the spec in a final "Completion" section.

- [ ] **Step 3: Commit**

`git add docs/superpowers/plans/2026-11-22-follow-along-ahkam-tags.md && git commit -m "docs: record follow-along tag plan completion"`
