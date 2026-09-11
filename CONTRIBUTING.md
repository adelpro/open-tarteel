# Contributing to Open Tarteel

Thank you for considering contributing to Open Tarteel. We appreciate
your help in making this project better.

Open Tarteel is a Next.js 15 / React 19 PWA for streaming Quran audio,
backed by Yarn 4 (Corepack) and Node 20. The dev server, linter, type
checker, tests, and build all share the toolchain pinned in
`package.json`.

## Quick start

Run these four commands to get a working dev server:

```bash
corepack enable
yarn install
yarn dev
```

`corepack` provisions the exact Yarn version pinned in
`package.json#packageManager`. Do not use npm — CI rejects it.

If you need the contact-form email backend, copy `.env.example` to
`.env.local` and fill in the `FEED_BACK_*` variables.

## Code of conduct

We expect everyone to be respectful, inclusive, and constructive.
Harassment or abuse of any kind is not tolerated. The full text is the
Contributor Covenant v2.1:
<https://www.contributor-covenant.org/version/2/1/code_of_conduct/>.

TODO: a dedicated `CODE_OF_CONDUCT.md` will be added at the repository
root.

## Reporting security issues

Do not open a public GitHub issue for security vulnerabilities. Email
`security@quran.us.kg` with a clear description and reproduction steps.

TODO: a dedicated `SECURITY.md` will be added and GitHub private
advisories will be enabled at
<https://github.com/adelpro/open-tarteel/security/advisories/new>.

## Requirements

- **Node** 20.x — pinned by `.github/workflows/ci.yml`.
- **Yarn** 4.13.0 — pinned by `package.json#packageManager` and
  provisioned by Corepack. Do not use npm — CI hard-fails non-yarn
  lockfiles.
- **Git** any recent version.
- **Browser** latest Chrome or Firefox, for manual QA.

## Branch model

| Branch          | Purpose                                             |
| --------------- | --------------------------------------------------- |
| `main`          | default branch, GitHub landing point                |
| `develop`       | active integration branch — default PR base         |
| `staging`       | pre-release promotion                               |
| tags (`vX.Y.Z`) | release cuts; `release-from-tag.yml` extracts notes |

The default base for new work is `develop`. Branch from the latest
`develop`. Release tags are cut from `main` after promotion through
`staging`.

Branch names follow Conventional-Commits-style prefixes:

- `feat/<scope>-<short-desc>`
- `fix/<scope>-<short-desc>`
- `chore/<short-desc>`
- `docs/<short-desc>`
- `refactor/<short-desc>`
- `test/<short-desc>`

## Development workflow

- TypeScript strict mode is on. Use functional React 19 components.
- Prettier rules (`semi: true`, `singleQuote: true`, `printWidth: 80`,
  `trailingComma: 'es5'`) are in `.prettierrc.mjs`.
- ESLint flat config lives in `eslint.config.mjs`. Active plugins:
  `react`, `react-hooks`, `unicorn`, `simple-import-sort`,
  `@typescript-eslint`.
- Staged files are auto-fixed and reformatted on `git commit` via
  `lint-staged`. You usually do not need to run `yarn format` yourself.
- One concern per PR. Do not mix refactors with new features.

## Pre-PR quality gate

Run these commands locally in the order CI does. Each is one
`package.json` script; do not invent new ones.

1. `yarn format:check` — Prettier dry-run. Auto-fix with `yarn format`.
2. `yarn lint` — ESLint with `--max-warnings=0`.
3. `yarn type-check` — `tsc --noemit`. Also runs as the first step of
   the `pre-commit` hook.
4. `yarn test:coverage` — Vitest with v8 coverage. CI uploads the
   report to Codecov.
5. `yarn build` — `next build`. CI also runs this against the
   development, staging, and production environment matrix.

If your change is user-visible, run `yarn dev` and exercise the affected
route(s) before pushing.

## Commit messages

Commit messages are enforced by `commitlint` via the `commit-msg`
Husky hook. The format is Conventional Commits:

```text
<type>(<optional-scope>): <subject>
```

Header must be 100 characters or fewer. Wrap the subject at 80
characters; wrap body text at the configured print width.

Allowed types — the exact list from `commitlint.config.mjs`:

- `feat` — new feature
- `fix` — bug fix
- `refactor` — code change that neither fixes a bug nor adds a feature
- `revert` — revert to a prior commit
- `style` — formatting only, no semantic change
- `test` — add or correct tests
- `docs` — documentation only
- `chore` — build process, auxiliary tools, or non-user-facing work
- `wip` — work in progress (not ready for production)
- `ci` — CI configuration files and scripts

Note: `perf` and `build` are NOT allowed and will be rejected by the
hook.

Examples:

```text
feat(reciters): add itqan adapter
fix(player): correct RTL alignment for sources list
chore(deps): bump next to 15.4.2
docs(readme): fix install command
```

For interactive commits, run `npx cz`. Commitizen with
`cz-conventional-changelog` is wired up via
`package.json#config.commitizen.path`.

## Verifying AI-generated or auto-generated code

AI assistants are welcome, but reviewers will not accept code that the
contributor cannot explain. Before requesting review:

- Build and test locally: `yarn format:check`, `yarn lint`,
  `yarn type-check`, `yarn test:coverage`, `yarn build`.
- Re-read the full diff. Remove anything you did not intend to commit.
- Add or update tests for any new behavior.
- If you cannot explain why a line is there, rewrite or remove it.
- Disclose AI assistance in the PR description. One sentence is enough.

## Pull requests

- Target branch: `develop`.
- Use the PR template at `.github/PULL_REQUEST_TEMPLATE.md`.
- Include screenshots or terminal output for user-visible changes.
- Reference related issues with `Fixes #` or `Refs #`.
- One logical change per PR. Split unrelated changes into separate PRs.

## Adding a feature or fixing a bug in `src/`

`src/` is a Next.js App Router project. Routes live under `src/app/`,
reusable UI under `src/components/`, data adapters under `src/services/`
(especially `src/services/reciters/`), state atoms under `src/jotai/`,
and helpers under `src/utils/`. Project layout and tech choices are
summarized in `README.md`.

Path aliases are configured in `tsconfig.json`; use them instead of long
relative imports:

- `@/` → `./src/`
- `@components/` → `./src/components/`
- `@hooks/` → `./src/hooks/`
- `@utils/` → `./src/utils/`
- `@types/` → `./src/types/`
- `@svgs/` → `./src/svgs/`
- `@assets/` → `./src/assets/`
- `@gun/` → `./src/gun/`

Tests are co-located as `*.test.ts` next to the code they cover, using
Vitest with the setup at `src/test/setup.ts`.

## Reporting bugs or requesting features

Open a new issue and pick the matching template:

- Bug report — `.github/ISSUE_TEMPLATE/bug_report.yml`. Required:
  description, steps to reproduce, expected behavior, environment
  (OS, browser, app version).
- Feature request — `.github/ISSUE_TEMPLATE/feature_request.yml`.
  Required: problem statement, desired solution. Optional:
  alternatives considered, additional context.

Include screenshots when they help. Reproduce the bug locally first if
you can — local repros are far easier to triage than screenshots alone.

## License

Open Tarteel is licensed under the MIT License (see `LICENSE`). By
submitting a pull request, you agree to license your contribution
under the same terms. Copyright holder: adelpro.
