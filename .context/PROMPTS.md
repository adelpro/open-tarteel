# Open Tarteel — AI Prompt Templates

## Quick Context Prompt (Copy-paste for any AI)

```
I'm working on Open Tarteel, an open-source Quran audio streaming PWA.

Stack: Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS 3, Jotai (state), Gun.js (P2P data), react-intl (i18n).

Key rules:
- All components use 'use client' directive
- Path aliases: @/, @components/, @hooks/, @utils/, @types/, @svgs/, @gun/
- Persisted state via Jotai createAtomWithStorage (not useState)
- UI strings via react-intl <FormattedMessage> — Arabic (RTL) default, English (LTR)
- No abbreviations in names (eslint-plugin-unicorn)
- Tailwind CSS only, cn() for conditional classes
- Conventional Commits: type(scope): description

Domain: Reciter (قارئ), Moshaf (مصحف), Riwaya (رواية), Surah (سورة)
API: https://www.mp3quran.net/api/v3/reciters
```

## Detailed Context Prompt

```
I'm working on Open Tarteel (https://github.com/adelpro/open-tarteel), a Quran audio streaming PWA.

Tech: Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS, Jotai, Gun.js, react-intl, Serwist (PWA).

Architecture:
- Root layout is a client component (unusual but intentional — wraps Jotai + IntlProvider)
- Pages follow pattern: page.tsx (server wrapper) + route-page.tsx (client component)
- State: Jotai atoms with localStorage persistence via createAtomWithStorage
- Data: MP3Quran API for reciters, Gun.js for global favorite/view counts
- Audio: HTML5 Audio + Media Session API + real-time visualizer
- i18n: Arabic (RTL, default) and English (LTR) via react-intl

Key files:
- src/components/player.tsx — core audio player
- src/utils/api.ts — API client (getAllReciters, getReciter)
- src/jotai/atom.ts — all Jotai atoms
- src/types/reciter.ts — Reciter, Moshaf types
- src/hooks/ — useReciters, useFavorites, useFilterSort, useMediaSession, useSleepTimer

Rules:
1. Always 'use client' in component files
2. Path aliases only (@/, @components/, etc.)
3. Jotai atoms for persisted state, useState for transient UI state only
4. react-intl for all user-facing strings (update both ar.json and en.json)
5. No abbreviations (unicorn ESLint) — exceptions: props, ref, params
6. Tailwind CSS only, cn() helper for conditional classes
7. Conventional Commits: type(scope): description
8. selectedReciter can be null — always handle the null case
9. Gun.js is client-only — never import in server components
10. Audio element needs crossOrigin="anonymous" for visualizer
```
