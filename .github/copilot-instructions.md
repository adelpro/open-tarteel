# Copilot Instructions for Open Tarteel

## Project Identity

Open Tarteel is a **Quran audio streaming PWA** built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Jotai**, and **Gun.js**. It supports Arabic (RTL, default) and English (LTR).

## Critical Rules

1. **Always use `'use client'`** — this project uses client-side rendering extensively. The root layout is a client component.
2. **Never use `useState` for persisted state** — use Jotai atoms via `createAtomWithStorage` from `@/jotai/create-atom-with-storage`.
3. **Imports must use path aliases** — always use `@/`, `@components/`, `@hooks/`, `@utils/`, `@types/`, `@svgs/`, `@gun/` instead of relative paths.
4. **Arabic is the primary language** — default locale is `'ar'`, RTL layout. All user-facing strings must use `react-intl` with `<FormattedMessage>` or `formatMessage()`.
5. **No abbreviations in variable names** — enforced by `eslint-plugin-unicorn`. Use `properties` not `props` (except React `props`/`ref`/`params` which are allowed).
6. **Conventional Commits required** — format: `type(scope): description`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

## Code Style

- **TypeScript strict mode** — no `any`, no implicit types
- **Functional components only** — no class components
- **Named exports for types** — barrel export via `index.ts`
- **Import order** (enforced by `simple-import-sort`):
  1. External packages
  2. `@/` aliased imports
  3. Relative imports
- **Tailwind CSS for all styling** — use `cn()` helper from `@/utils` for conditional classes (combines `clsx` + `tailwind-merge`)
- **No inline styles** — use Tailwind utilities or CSS variables
- **Prettier** with `prettier-plugin-tailwindcss` for class sorting

## Architecture Patterns

### State Management (Jotai)
```typescript
// Creating a persisted atom:
import { createAtomWithStorage } from '@/jotai/create-atom-with-storage';
export const myAtom = createAtomWithStorage<MyType>('storage-key', defaultValue);

// Using atoms in components:
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
const [value, setValue] = useAtom(myAtom);
const value = useAtomValue(myAtom);     // read-only
const setValue = useSetAtom(myAtom);     // write-only
```

### Internationalization
```typescript
// In components — prefer declarative:
<FormattedMessage id="message.key" defaultMessage="Fallback" />

// In hooks/logic — imperative:
const { formatMessage } = useIntl();
formatMessage({ id: 'message.key', defaultMessage: 'Fallback' });
```
- Add new keys to BOTH `src/locales/ar.json` AND `src/locales/en.json`

### API Data Flow
- External API: `https://www.mp3quran.net/api/v3/reciters`
- Client: `src/utils/api.ts` → `getAllReciters()` / `getReciter()`
- API responses are transformed into app `Reciter` types
- Audio URLs follow pattern: `{server}{surahId_padded_3}.mp3`

### Component Patterns
- **Dynamic imports** for heavy components: `dynamic(() => import(...), { ssr: false })`
- **Suspense boundaries** with `SimpleSkeleton` fallback
- **Hydration safety**: Use `useState(false)` + `useEffect(() => setMounted(true))` pattern for client-only content

### Custom Hooks
- `useReciters()` — fetch and manage reciter data
- `useFavorites()` — local + Gun.js favorites sync
- `useFilterSort()` — search, filter by riwaya, sort reciters
- `useMediaSession()` — Media Session API integration
- `useSleepTimer()` — countdown-based auto-pause
- `useDirection()` — RTL/LTR detection

## File Organization

- **Pages**: `src/app/{route}/page.tsx` (server) + `{route}/{route}-page.tsx` (client)
- **Components**: `src/components/*.tsx` — flat structure, no nesting
- **Hooks**: `src/hooks/use-*.ts`
- **Types**: `src/types/*.ts` with barrel `index.ts`
- **Utils**: `src/utils/*.ts` with barrel `index.ts`
- **Constants**: `src/constants/*.ts` with barrel `index.ts`
- **State**: `src/jotai/atom.ts`

## Key Domain Concepts

- **Reciter** (قارئ): A Quran reciter
- **Moshaf** (مصحف): A specific recording set by a reciter
- **Riwaya** (رواية): Recitation style/transmission chain (Hafs, Warsh, etc.)
- **Surah** (سورة): A chapter of the Quran (114 total)
- **Playlist**: Array of `{ surahId, link }` for a moshaf

## Testing & Quality

- Run `npm run type-check` before committing
- Run `npm run lint:fix` to auto-fix lint issues
- Ensure both AR and EN translations are added for new strings
- Test RTL layout when adding UI changes

## Common Pitfalls

1. **Don't use `null` checks** — unicorn/no-null is off but be explicit
2. **Don't forget `'use client'`** — most components need it due to Jotai/react-intl
3. **Audio element uses `crossOrigin="anonymous"`** — required for visualizer
4. **Gun.js is client-only** — never import gun modules in server components
5. **Serwist/PWA is disabled in development** — only builds in production
6. **`selectedReciter` can be null** — always handle the null case
