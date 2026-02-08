# CLAUDE.md — AI Assistant Context for Open Tarteel

> This file provides context for Claude and other AI assistants working on this codebase.

## Project Summary

Open Tarteel is an open-source **Quran audio streaming PWA** built with Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, Jotai, Gun.js, and react-intl. It fetches reciter data from the MP3Quran API and streams Quran audio files.

## Before You Code

1. **Read** `PROJECT.md` for comprehensive project details
2. **Read** `ARCHITECTURE.md` for system design and data flows
3. **Read** `CONVENTIONS.md` for coding standards
4. **Read** `.github/copilot-instructions.md` for coding rules

## Absolute Rules

- Every component file starts with `'use client'`
- Use path aliases (`@/`, `@components/`, etc.) — never relative paths to other directories
- Persisted state = Jotai atoms via `createAtomWithStorage` — NEVER `useState`
- All user-facing strings via `react-intl` — update BOTH `ar.json` and `en.json`
- No abbreviations in variable names (ESLint unicorn enforced)
- Use `cn()` from `@/utils` for conditional Tailwind classes
- Conventional Commits: `type(scope): description`

## Common Tasks

### Adding a new feature
1. Create component in `src/components/` with `'use client'`
2. Add any new atoms to `src/jotai/atom.ts`
3. Add translations to both locale files
4. Create hook if logic is reusable (`src/hooks/use-*.ts`)
5. Export types from `src/types/` barrel

### Modifying the player
- Core logic is in `src/components/player.tsx`
- Controls UI in `src/components/player-controls.tsx`
- Media Session integration in `src/hooks/use-media-session.ts`
- Player dynamically imported: `dynamic(() => import(...), { ssr: false })`

### Working with the API
- API client: `src/utils/api.ts`
- Endpoint: `https://www.mp3quran.net/api/v3/reciters`
- Types: `Reciter`, `Moshaf`, `MP3APIMoshaf`, `mp3QuranAPiResponse` in `src/types/reciter.ts`
- Audio URL pattern: `{moshaf.server}{surahId.padStart(3, '0')}.mp3`

### Adding a new page
- Create `src/app/my-route/page.tsx` (server wrapper)
- Create `src/app/my-route/my-route-page.tsx` (client component)
- Add footer link in `src/components/footer.tsx`
- Add translations for page title

## Key Gotchas

1. Root layout is a client component — unusual for Next.js but required for Jotai/IntlProvider
2. `selectedReciter` can be `null` — always handle null case
3. Gun.js is client-only — never import in server components
4. Audio `crossOrigin="anonymous"` is required for the visualizer to work
5. PWA/Serwist is disabled in dev — only builds in production
6. The `reciter/[id]/page.tsx` is a server component with `generateStaticParams` — don't add `'use client'` there
7. `removeTashkeel` and `normalizeArabicText` are critical for Arabic text search

## Quality Checks

```bash
npm run type-check    # TypeScript checking
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier formatting
npm run build         # Full production build
```
