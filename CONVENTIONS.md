# Open Tarteel — Coding Conventions

## Naming Conventions

### Files

- **Components**: `kebab-case.tsx` (e.g., `player-controls.tsx`, `reciter-card.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-favorites.ts`, `use-sleep-timer.ts`)
- **Types**: `kebab-case.ts` (e.g., `reciter.ts`, `playlist.ts`)
- **Utils**: `kebab-case.ts` (e.g., `format-time.ts`, `generate-fav-id.ts`)
- **Constants**: `kebab-case.ts` (e.g., `gun-config.ts`, `surah.ts`)
- **Pages**: `page.tsx` (server) + `{route}-page.tsx` (client)

### Variables & Functions

- **No abbreviations**: `properties` not `props`, `reference` not `ref`, `parameters` not `params`
  - Exceptions: React `props`, `ref`, `params` are allowed (configured in ESLint)
- **camelCase**: for variables, functions, hook names
- **PascalCase**: for components, types, interfaces, enums
- **SCREAMING_SNAKE_CASE**: for constants (e.g., `SURAHS`, `GUNCONFIG`)

### Exports

- **Default exports** for components and pages
- **Named exports** for types, hooks, utilities, and constants
- **Barrel exports** via `index.ts` in `types/`, `utils/`, `constants/`

## Import Order (Enforced)

```typescript
// 1. External packages (react, next, jotai, etc.)
import { useAtom } from 'jotai';
import React from 'react';

// 2. Aliased imports (@/ paths)
import { selectedReciterAtom } from '@/jotai/atom';
import { cn } from '@/utils';

// 3. Relative imports (only for co-located files)
import PlayerControls from './player-controls';
```

## Component Structure

```typescript
'use client';                           // 1. Client directive (always)

import { /* externals */ } from '...';  // 2. External imports
import { /* aliases */ } from '@/...';  // 3. Aliased imports
import { /* relative */ } from './...'; // 4. Relative imports

type Properties = {                     // 5. Type definitions
  title: string;
};

export default function MyComponent({ title }: Properties) {  // 6. Component
  // a. Jotai atoms
  const value = useAtomValue(myAtom);

  // b. React state (transient only)
  const [isOpen, setIsOpen] = useState(false);

  // c. Hooks
  const { formatMessage } = useIntl();

  // d. Effects
  useEffect(() => { /* ... */ }, []);

  // e. Handlers
  const handleClick = () => { /* ... */ };

  // f. Render
  return <div>...</div>;
}
```

## Styling Rules

- **Always use Tailwind CSS** — never inline `style` attributes
- **Conditional classes**: Use `cn()` helper from `@/utils`

  ```typescript
  className={cn('base-class', isActive && 'active-class', 'always-on')}
  ```

- **Responsive design**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Dark mode**: Use `dark:` variant (class-based strategy)
- **RTL support**: Use logical properties where possible (`ps-`, `pe-`, `ms-`, `me-`)
- **Class sorting**: Automatic via `prettier-plugin-tailwindcss`

## State Management Rules

1. **Persisted state** → Jotai atom via `createAtomWithStorage`
2. **Component-local transient state** → `useState` (e.g., `isOpen`, `mounted`)
3. **Derived/computed state** → `useMemo` or Jotai derived atoms
4. **Never** use React Context for state — use Jotai atoms instead

## Internationalization Rules

1. **All user-visible text** must use `react-intl`
2. **In JSX** → `<FormattedMessage id="key" defaultMessage="Fallback" />`
3. **In logic** → `formatMessage({ id: 'key', defaultMessage: 'Fallback' })`
4. **Always add** to both `src/locales/ar.json` AND `src/locales/en.json`
5. **Key naming**: `section.subsection.action` (e.g., `contact.send`, `riwaya.Hafs`)

## Error Handling

- API calls: Use try/catch, return empty arrays/undefined on failure
- Component rendering: Use Suspense boundaries with `SimpleSkeleton`
- Null reciter: Always check `selectedReciter` before accessing properties
- Hydration: Use the `mounted` pattern (`useState(false)` + `useEffect`)

## Git Conventions

- **Commits**: Conventional Commits format — `type(scope): description`
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Pre-commit**: Husky + lint-staged runs Prettier + ESLint
- **Branch naming**: `feature/description`, `fix/description`
