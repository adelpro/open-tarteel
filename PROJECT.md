# PROJECT.md — Open Tarteel

> **Comprehensive project reference for AI assistants, LLMs, and contributors.**
> Last updated: 2026-02-08

---

## 1. Project Overview

**Open Tarteel** is an open-source **Quran audio streaming Progressive Web App (PWA)** that provides an intuitive and distraction-free listening experience for the Holy Quran. Users can browse reciters, select from multiple Quranic recitation styles (riwayat), stream surahs, and manage favorites — all from a responsive, installable web app.

| Field             | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| **Name**          | Open Tarteel                                             |
| **Version**       | 0.2.2                                                    |
| **License**       | MIT                                                      |
| **Repository**    | <https://github.com/adelpro/open-tarteel>                  |
| **Production URL**| <https://tarteel.quran.us.kg>                              |
| **Author**        | adelpro                                                  |
| **Language**      | TypeScript (strict)                                      |
| **Framework**     | Next.js 15 (App Router)                                  |
| **Runtime**       | Node.js / React 19                                       |
| **Package Manager**| npm                                                     |

---

## 2. Tech Stack

### Core

| Technology        | Purpose                                          | Version  |
| ----------------- | ------------------------------------------------ | -------- |
| **Next.js**       | Full-stack React framework (App Router, SSR/SSG) | ^15.4.2  |
| **React**         | UI library                                       | ^19.1.0  |
| **TypeScript**    | Type safety                                      | ^5       |
| **Tailwind CSS**  | Utility-first CSS styling                        | ^3.4.1   |

### State Management & Data

| Technology     | Purpose                                                  |
| -------------- | -------------------------------------------------------- |
| **Jotai**      | Atomic state management with localStorage persistence    |
| **Gun.js**     | Decentralized real-time database for favorites & view counts |
| **react-intl** | Internationalization (Arabic & English)                  |

### Audio & Media

| Technology          | Purpose                              |
| ------------------- | ------------------------------------ |
| **HTML5 Audio API** | Core audio playback                  |
| **Media Session API** | OS-level media controls integration |
| **wavesurfer.js**   | Audio waveform visualization         |
| **react-audio-spectrum** | Audio bars visualizer           |

### PWA & Offline

| Technology       | Purpose                                    |
| ---------------- | ------------------------------------------ |
| **Serwist**      | Service worker management (next-pwa fork)  |
| **CacheFirst**   | Runtime caching for MP3 audio files (7 days) |

### Utilities

| Technology       | Purpose                        |
| ---------------- | ------------------------------ |
| **fuse.js**      | Fuzzy search                   |
| **clsx / tailwind-merge** | Conditional CSS classes |
| **sanitize-html**| HTML sanitization for security |
| **nodemailer**   | Server-side email (feedback)   |

### Dev Tooling

| Tool                  | Purpose                              |
| --------------------- | ------------------------------------ |
| **ESLint**            | Linting (flat config, unicorn, import) |
| **Prettier**          | Code formatting                      |
| **Husky + lint-staged** | Pre-commit hooks                  |
| **Commitlint**        | Conventional commit enforcement     |
| **Commitizen**        | Interactive commit helper           |
| **@next/bundle-analyzer** | Bundle size analysis            |
| **@svgr/webpack**     | SVG as React components             |

---

## 3. Project Architecture

### Directory Structure

```
open-tarteel/
├── public/                    # Static assets (images, icons, screenshots)
│   ├── images/                # App logos, icons (192x192, 512x512)
│   └── screenshots/           # PWA install screenshots
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout ('use client' — Jotai + IntlProvider)
│   │   ├── page.tsx           # Home page — reciter selection
│   │   ├── manifest.ts        # PWA Web App Manifest
│   │   ├── robots.ts          # SEO robots.txt generation
│   │   ├── sitemap.ts         # SEO sitemap generation
│   │   ├── globals.css        # Global CSS + CSS variables
│   │   ├── loading.tsx        # Global loading fallback
│   │   ├── not-found.tsx      # 404 page
│   │   ├── _error.tsx         # Error page
│   │   ├── about/             # About page
│   │   ├── contact/           # Contact form page
│   │   ├── privacy/           # Privacy policy page
│   │   ├── reciter/[id]/      # Dynamic reciter page (SSG)
│   │   └── api/
│   │       └── send-feedback/ # POST API route (email feedback)
│   ├── components/            # React components
│   │   ├── player.tsx         # Main audio player (core component)
│   │   ├── player-controls.tsx # Playback controls UI
│   │   ├── playlist.tsx       # Surah playlist display
│   │   ├── playlist-dialog.tsx # Modal playlist viewer
│   │   ├── reciter-selector.tsx        # Reciter picker with favorites
│   │   ├── reciter-selector-dialog.tsx # Reciter search/filter dialog
│   │   ├── reciters-list.tsx  # Reciter grid/list display
│   │   ├── reciter-card.tsx   # Individual reciter card
│   │   ├── hero.tsx           # Hero section with logo
│   │   ├── footer.tsx         # Bottom navigation bar
│   │   ├── footer-link.tsx    # Footer navigation link
│   │   ├── language-switcher.tsx # AR/EN toggle
│   │   ├── intl-provider-wrapper.tsx # react-intl setup
│   │   ├── html-wrapper.tsx   # <html> with RTL/LTR support
│   │   ├── audio-bars-visualizer.tsx # Audio visualization
│   │   ├── range.tsx          # Seek/progress slider
│   │   ├── track-info.tsx     # Current track metadata
│   │   ├── dialog.tsx         # Reusable dialog component
│   │   ├── tooltip.tsx        # Tooltip component
│   │   ├── tags.tsx           # Tag/badge component
│   │   ├── loader.tsx         # Loading spinner
│   │   ├── skeleton.tsx       # Skeleton loading
│   │   ├── simple-skeleton.tsx # Simple skeleton variant
│   │   ├── exit-fullscreen.tsx # Fullscreen exit button
│   │   ├── pwa-updater.tsx    # PWA update notification
│   │   └── under-construction.tsx # Dev notice banner
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-reciters.ts    # Fetch reciters from API
│   │   ├── use-favorites.ts   # Favorite management + Gun sync
│   │   ├── use-filter-sort.ts # Search, filter, sort reciters
│   │   ├── use-media-session.ts # Media Session API integration
│   │   ├── use-sleep-timer.ts # Sleep timer functionality
│   │   ├── use-direction.ts   # RTL/LTR detection
│   │   ├── use-escape-key-hook.ts # ESC key listener
│   │   └── use-keyboard-navigation.ts # Keyboard nav support
│   ├── jotai/                 # State management
│   │   ├── atom.ts            # All Jotai atoms (persisted)
│   │   └── create-atom-with-storage.ts # localStorage atom factory
│   ├── gun/                   # Gun.js decentralized data
│   │   ├── index.ts           # Gun instance
│   │   ├── favorite-rank.ts   # Global favorite counts
│   │   └── view-rank.ts       # Global view counts
│   ├── constants/             # Static data & configuration
│   │   ├── surah.ts           # All 114 surahs metadata
│   │   ├── player-controls.ts # Player control constants
│   │   ├── riwaya-name-by-locale.ts # Riwaya name mappings
│   │   ├── gun-config.ts      # Gun.js configuration
│   │   ├── gun-keys.ts        # Gun.js data keys
│   │   └── gun-peers.ts       # Gun.js peer servers
│   ├── types/                 # TypeScript type definitions
│   │   ├── reciter.ts         # Reciter, Moshaf, API response types
│   │   ├── surah.ts           # Surah type
│   │   ├── riwaya.ts          # Riwaya enum (13 recitation styles)
│   │   ├── playlist.ts        # PlaylistItem, Playlist types
│   │   ├── link-source.ts     # LinkSource enum (MP3Quran, etc.)
│   │   ├── track-type.ts      # Track type definitions
│   │   ├── pwa-updater.ts     # PWA updater types
│   │   └── environment.d.ts   # Environment variable types
│   ├── utils/                 # Utility functions
│   │   ├── api.ts             # MP3Quran API client (getAllReciters, getReciter)
│   │   ├── config.ts          # App configuration (env vars)
│   │   ├── search.ts          # Search utilities
│   │   ├── share.ts           # Web Share API integration
│   │   ├── cn.ts              # clsx + tailwind-merge helper
│   │   ├── format-time.ts     # Time formatting
│   │   ├── generate-fav-id.ts # Favorite ID generator
│   │   ├── sanitize-html.ts   # HTML sanitization wrapper
│   │   ├── normalize-app-url.ts # URL normalization
│   │   ├── is-valid-email.ts  # Email validation
│   │   ├── is-valid-magnet-uri.ts # Magnet URI validation
│   │   ├── get-riwaya-from-mushaf.ts # Riwaya extraction from name
│   │   ├── get-error-message.ts # Error message helper
│   │   ├── get-circular-replacer.ts # JSON circular ref handler
│   │   ├── node-mailer.ts     # Nodemailer transporter setup
│   │   └── storage/           # Storage utilities for Jotai
│   ├── locales/               # i18n translation files
│   │   ├── ar.json            # Arabic translations
│   │   └── en.json            # English translations
│   ├── svgs/                  # SVG icon assets
│   ├── assets/                # Other static assets
│   └── sw.ts                  # Service worker (Serwist)
├── next.config.ts             # Next.js + Serwist + Bundle Analyzer
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint flat config
├── postcss.config.mjs         # PostCSS configuration
├── commitlint.config.mjs      # Commitlint configuration
└── package.json               # Dependencies & scripts
```

### Rendering Strategy

| Route              | Rendering  | Notes                                  |
| ------------------ | ---------- | -------------------------------------- |
| `/`                | CSR        | Client component, redirects on reciter selection |
| `/reciter/[id]`    | SSG + CSR  | `generateStaticParams` + dynamic client content |
| `/about`           | CSR        | Static content with i18n               |
| `/contact`         | CSR        | Form with API call                     |
| `/privacy`         | CSR        | Privacy policy display                 |
| `/api/send-feedback` | Server   | Next.js Route Handler (POST)           |

---

## 4. Key Domain Concepts

### Quran Audio Hierarchy

```
Reciter (قارئ)
  └── Moshaf (مصحف) — a specific recording set
       ├── Riwaya (رواية) — recitation style (e.g., Hafs, Warsh)
       ├── Server — audio file host URL
       └── Playlist — array of PlaylistItems
            └── PlaylistItem
                 ├── surahId — 1-114
                 └── link — full MP3 URL
```

### Core Types

```typescript
type Reciter = {
  id: number;
  name: string;
  moshaf: Moshaf;
  source: LinkSource;
};

type Moshaf = {
  id: string;
  name: string;
  riwaya: Riwaya;
  server: string;
  surah_total: string;
  playlist: Playlist;
};

enum Riwaya {
  Hafs, Warsh, Qaloon, Khalaf, AlBazzi,
  AlSoosi, AlDooriKisai, AlDooriAbuAmr,
  Shuaba, IbnZakwan, Hisham, IbnJammaz, Yaqoub
}

type PlaylistItem = { surahId: string; link: string };
type Playlist = PlaylistItem[];

enum LinkSource {
  MP3QURAN = 'mp3quran.net',
  ISLAMHOUSE = 'islamhouse.com',
  INTERNETARCHIVE = 'archive.org',
  UNKNOWN = 'unknown',
}

type Surah = {
  id: number;
  name: string;          // Arabic with tashkeel
  englishName: string;
  revelationType: 'Meccan' | 'Medinan';
  ayahCount: number;
};
```

### External API

The app fetches reciter data from the **MP3Quran API**:

- **Endpoint**: `https://www.mp3quran.net/api/v3/reciters?language={locale}`
- **Reciter detail**: `https://www.mp3quran.net/api/v3/reciters?language={locale}&reciter={id}`
- **Caching**: `next: { revalidate: 3600 }` (1 hour)
- **Audio URLs**: Pattern `{server}{surahId_padded_3}.mp3`

---

## 5. State Management

All state is managed via **Jotai atoms** with localStorage persistence:

| Atom                    | Type                           | Default        | Purpose                     |
| ----------------------- | ------------------------------ | -------------- | --------------------------- |
| `selectedReciterAtom`   | `Reciter \| null`              | `null`         | Currently selected reciter  |
| `selectedRiwayaAtom`    | `Riwaya \| 'all'`             | `'all'`        | Riwaya filter               |
| `favoriteRecitersAtom`  | `string[]`                     | `[]`           | Favorite reciter IDs        |
| `localeAtom`            | `'ar' \| 'en'`                | `'ar'`         | UI language                 |
| `fullscreenAtom`        | `boolean`                      | `false`        | Fullscreen mode             |
| `showVisualizerAtom`    | `boolean`                      | `true`         | Audio visualizer toggle     |
| `currentTimeAtom`       | `number`                       | `0`            | Audio current time          |
| `playbackSpeedAtom`     | `number`                       | `1`            | Playback speed multiplier   |
| `playbackModeAtom`      | `PlaybackMode`                 | `'off'`        | off / shuffle / repeat-one  |
| `volumeAtom`            | `number`                       | `1`            | Volume level (0-1)          |
| `recitersSortAtom`      | `popular\|alphabetical\|views` | `'alphabetical'` | Sort mode for reciter list |
| `hideUnderConstructionAtom` | `boolean`                  | `false`        | Hide dev notice             |

---

## 6. Internationalization (i18n)

- **Library**: `react-intl` (FormatJS)
- **Languages**: Arabic (`ar`) — default, English (`en`)
- **Direction**: RTL for Arabic, LTR for English (dynamic via `useDirection` hook)
- **Translation files**: `src/locales/ar.json`, `src/locales/en.json`
- **Switching**: In-app toggle via `LanguageSwitcher` component
- **Font**: Tajawal (Google Fonts, Arabic subset, preloaded)

---

## 7. PWA Configuration

- **Service Worker**: Serwist (built from `src/sw.ts`)
- **Precaching**: Automatic via Serwist (with 100MB max file size)
- **Runtime Caching**: MP3Quran audio files cached with `CacheFirst` strategy (7 days, max 20 entries)
- **Install**: Full PWA manifest with icons, screenshots, shortcuts
- **Update**: `PwaUpdater` component handles service worker updates

---

## 8. Decentralized Data (Gun.js)

The app uses **Gun.js** for decentralized, real-time shared data:

- **Favorite Counts**: Global favorite counts synced across users
- **View Counts**: Global view counts synced across users
- **Configuration**: No localStorage/radisk (in-memory only, read from peers)
- **Data Keys**: Defined in `src/constants/gun-keys.ts`
- **Peers**: Defined in `src/constants/gun-peers.ts`

---

## 9. API Routes

### `POST /api/send-feedback`

Contact form email handler with:

- **Rate limiting**: 5 requests per minute per IP
- **Memory cleanup**: Periodic `setInterval` cleanup of rate limit map
- **Validation**: Name, email, message required; email validated
- **Transport**: Nodemailer with configurable SMTP
- **Sanitization**: HTML sanitized via `sanitize-html`

---

## 10. Environment Variables

### Public (Client-side)

| Variable                 | Description                |
| ------------------------ | -------------------------- |
| `NEXT_PUBLIC_APP_NAME`   | Application name           |
| `NEXT_PUBLIC_APP_URL`    | Production URL             |
| `NEXT_PUBLIC_TRACKER_URL`| Analytics tracker URL      |
| `NEXT_PUBLIC_DEBUG`      | Debug mode flag            |

### Private (Server-side)

| Variable             | Description              |
| -------------------- | ------------------------ |
| `PORT`               | Server port              |
| `FEED_BACK_EMAIL`    | Feedback email address   |
| `FEED_BACK_PASSWORD` | Feedback email password  |
| `FEED_BACK_SERVICE`  | Email service provider   |
| `FEED_BACK_HOST`     | SMTP host                |
| `FEED_BACK_PORT`     | SMTP port                |

---

## 11. Scripts

| Script          | Command                    | Purpose                    |
| --------------- | -------------------------- | -------------------------- |
| `dev`           | `next dev`                 | Development server         |
| `dev:turbo`     | `next dev --turbopack`     | Dev with Turbopack         |
| `build`         | `next build`               | Production build           |
| `start`         | `next start`               | Start production server    |
| `lint`          | `next lint`                | Run ESLint                 |
| `lint:fix`      | `next lint --fix`          | Auto-fix lint issues       |
| `type-check`    | `tsc --noemit`             | TypeScript type checking   |
| `format`        | `prettier --write .`       | Format all files           |

---

## 12. Key Features

1. **Reciter Browser**: Search, filter by riwaya, sort by alphabet/popularity/views
2. **Audio Player**: Play/pause, next/previous, seek, volume, playback speed
3. **Playlist Management**: Surah-based playlist with dialog view
4. **Playback Modes**: Normal, shuffle, repeat-one
5. **Sleep Timer**: Auto-pause after configurable duration
6. **Favorites**: Star reciters, filter favorites, Gun.js global sync
7. **Fullscreen Mode**: Immersive player view
8. **Audio Visualization**: Real-time audio bars display
9. **Media Session**: OS-level controls (lockscreen, notification area)
10. **Sharing**: Web Share API for sharing reciters
11. **Offline Support**: PWA with audio caching
12. **Bilingual**: Arabic (RTL) and English (LTR) with runtime switching
13. **SEO**: OpenGraph, Twitter Cards, JSON-LD, sitemap, robots.txt
14. **Contact Form**: Server-side email with rate limiting

---

## 13. Path Aliases

Defined in `tsconfig.json`:

| Alias             | Maps to              |
| ----------------- | -------------------- |
| `@/*`             | `./src/*`            |
| `@components/*`   | `./src/components/*` |
| `@types/*`        | `./src/types/*`      |
| `@assets/*`       | `./src/assets/*`     |
| `@utils/*`        | `./src/utils/*`      |
| `@svgs/*`         | `./src/svgs/*`       |
| `@hooks/*`        | `./src/hooks/*`      |
| `@gun/*`          | `./src/gun/*`        |

---

## 14. Design System

### Colors (CSS Variables)

| Variable          | Light       | Dark        |
| ----------------- | ----------- | ----------- |
| `--background`    | `#ffffff`   | `#0a0a0a`   |
| `--foreground`    | `#171717`   | `#ededed`   |
| `--card`          | `#f9fafb`   | `#1f2937`   |

### Brand Colors

| Name                        | Hex       |
| --------------------------- | --------- |
| `brand-CTA-blue-500`       | `#0190dd` |
| `brand-CTA-blue-600`       | `#07507f` |
| `brand-CTA-green-500`      | `#10B981` |
| `brand-CTA-green-600`      | `#059669` |
| `brand-CTA-red-500`        | `#FF4B4B` |
| `brand-CTA-red-600`        | `#DB2727` |
| `brand-success`            | `#4BB543` |
| `brand-info`               | `#4D71F9` |
| `brand-warning`            | `#FFA800` |
| `brand-danger`             | `#FF4B4B` |

### Animations

- `slideIn`, `fadeIn`, `appear`, `spinOnce`, `slideInWithFade`
- Tailwind CSS Animated plugin enabled

### Dark Mode

- Strategy: `class` (via Tailwind)
- Auto-detected via `prefers-color-scheme` media query in CSS variables

---

## 15. Known Patterns & Conventions

- **All pages are client components** (`'use client'`) — the root layout itself is a client component
- **Dynamic imports** used for heavy components (e.g., `Player` is lazy-loaded)
- **Barrel exports** used throughout (`types/index.ts`, `utils/index.ts`, `constants/index.ts`)
- **Atoms use `createAtomWithStorage`** for consistent localStorage persistence
- **Arabic text processing**: `removeTashkeel` and `normalizeArabicText` utilities for search
- **Conventional Commits** enforced via Commitlint + Husky
- **ESLint Unicorn** plugin enforced (no abbreviations, no null exceptions configured)
- **Import sorting** via `eslint-plugin-simple-import-sort`
