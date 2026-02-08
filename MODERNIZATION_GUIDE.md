# Open Tarteel Modernization Guide

> **Current Stack Assessment**: While Open Tarteel uses Next.js 15.4.2 and React 19.1.0 (latest versions), there are opportunities to adopt modern patterns, migrate to more robust state management, and leverage cutting-edge features for better performance and DX.

**Last Updated**: February 2026
**Current Version**: 0.2.2

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Package Manager Migration (npm → pnpm)](#package-manager-migration-npm--pnpm)
- [Next.js 16 Migration](#nextjs-16-migration)
- [Tailwind CSS v4 Migration](#tailwind-css-v4-migration)
- [Zod v4 Migration](#zod-v4-migration)
- [i18n Migration (react-intl → next-intl)](#i18n-migration-react-intl--next-intl)
- [UI Components with shadcn/ui](#ui-components-with-shadcnui)
- [State Management Migration](#state-management-migration)
- [PWA & Offline-First (Serwist + Turbopack)](#pwa--offline-first-serwist--turbopack)
- [Audio Management Modernization](#audio-management-modernization)
- [React 19 Patterns & Server Components](#react-19-patterns--server-components)
- [P2P Sync Alternatives](#p2p-sync-alternatives)
- [Build & Tooling Upgrades](#build--tooling-upgrades)
- [TypeScript & Type Safety](#typescript--type-safety)
- [Testing Strategy Evolution](#testing-strategy-evolution)
- [Performance Optimization](#performance-optimization)
- [Package Version Upgrades](#package-version-upgrades)
- [Migration Roadmap](#migration-roadmap)

---

## Executive Summary

### Current Stack (2026)
```json
{
  "packageManager": "npm",
  "runtime": "Next.js 15.4.2 (App Router)",
  "react": "19.1.0",
  "state": "Jotai 2.11.1",
  "storage": "localStorage + Gun.js",
  "pwa": "Serwist 9.0.12",
  "i18n": "react-intl 7.1.11",
  "styling": "Tailwind CSS 3.4.1",
  "search": "Fuse.js 7.1.0",
  "validation": "None",
  "components": "Custom",
  "testing": "Vitest 4.0.18"
}
```

### Recommended Stack (2026)
```json
{
  "packageManager": "pnpm 10.x",
  "runtime": "Next.js 16.x (Turbopack)",
  "react": "19.1.0",
  "state": "Zustand 5.x",
  "storage": "IndexedDB + Y.js",
  "pwa": "Serwist 10.x (Turbopack)",
  "i18n": "next-intl 4.x",
  "styling": "Tailwind CSS 4.x",
  "search": "Fuse.js 7.1.0",
  "validation": "Zod 4.x",
  "components": "shadcn/ui",
  "testing": "Vitest 4.0.18 + Playwright 1.x"
}
```

### Modernization Priorities

| Priority | Area | Effort | Impact | Status |
|----------|------|--------|--------|--------|
| **HIGH** | Package Manager (npm → pnpm) | Low | Medium | 🟢 Easy |
| **HIGH** | Next.js 16 Upgrade | Low | High | 🟢 Required |
| **HIGH** | Tailwind v4 Migration | Medium | High | 🟡 Breaking |
| **HIGH** | State Management (Jotai → Zustand) | Medium | High | 🟡 Recommended |
| **HIGH** | i18n (react-intl → next-intl) | Medium | High | 🟡 Required |
| **HIGH** | shadcn/ui Components | Medium | High | 🟢 Additive |
| **MEDIUM** | Zod v4 Migration | Low | Medium | 🟢 Easy |
| **MEDIUM** | Serwist 10 + Turbopack | Low | Medium | 🟢 Available |
| **MEDIUM** | Audio API Modernization | High | High | 🟡 Needed |
| **MEDIUM** | P2P (Gun.js → Y.js) | High | Medium | 🔴 Complex |
| **LOW** | Testing (E2E with Playwright) | Medium | Medium | 🟡 Missing |

---

## Package Manager Migration (npm → pnpm)

### Why pnpm?

**Performance & Efficiency:**
- **3x faster installs** than npm/yarn
- **Disk space savings**: Content-addressable storage (single copy of packages)
- **Strict by default**: No phantom dependencies
- **Better monorepo support**: Workspaces with proper isolation
- **Built-in caching**: Fast CI/CD pipelines

**Modern Features:**
- Supports all npm/yarn commands
- Superior workspace management
- Patch package support built-in
- Better peer dependency resolution

### Migration Steps

#### 1. Install pnpm

**Windows (PowerShell):**
```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

**Or via npm (will be removed later):**
```bash
npm install -g pnpm@latest
```

#### 2. Configure pnpm

**Create `.npmrc`:**
```ini
# Strict peer dependencies (catches issues early)
strict-peer-dependencies=true

# Hoist patterns for specific packages (if needed)
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*

# Enable shamefully-hoist if you have phantom dependency issues
# shamefully-hoist=true

# Auto-install peers
auto-install-peers=true

# Use lockfile v9 (latest)
lockfile-version=v9
```

**Update `package.json`:**
```json
{
  "packageManager": "pnpm@10.9.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

#### 3. Migrate Dependencies

```bash
# Remove old files
rm -rf node_modules package-lock.json

# Import from package-lock.json
pnpm import

# Or fresh install
pnpm install

# Remove --legacy-peer-deps workarounds
# pnpm handles React 19 peer deps correctly
```

#### 4. Update Scripts

**package.json** - No changes needed! All scripts work as-is:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest"
  }
}
```

But you can use pnpm-specific features:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "test": "vitest",
    "clean": "pnpm store prune",
    "update:latest": "pnpm up --latest"
  }
}
```

#### 5. Update CI/CD

**GitHub Actions (`.github/workflows/ci.yml`):**
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - run: pnpm test
```

#### 6. Update Documentation

**README.md:**
```markdown
## Installation

\`\`\`bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Run development server
pnpm dev
\`\`\`
```

### Common Issues & Solutions

**Phantom Dependencies:**
```bash
# If you have import errors for packages not in package.json
# Option 1: Add them explicitly
pnpm add <missing-package>

# Option 2: Enable shamefully-hoist (not recommended)
echo "shamefully-hoist=true" >> .npmrc
```

**Peer Dependency Warnings:**
```bash
# pnpm is stricter - fix actual issues
pnpm why <package-name>
```

**Migration Checklist:**
- [x] Install pnpm globally
- [x] Create/update `.npmrc`
- [x] Update `package.json` with `packageManager` field
- [x] Remove `node_modules` and `package-lock.json`
- [x] Run `pnpm install`
- [x] Test all scripts (`dev`, `build`, `test`)
- [x] Update CI/CD pipelines
- [x] Update README.md
- [x] Commit `pnpm-lock.yaml`

---

## Next.js 16 Migration

### What's New in Next.js 16

**Major Features:**
- **Turbopack Stable**: Default for `dev` and `build`
- **React Server Components v2**: Better streaming and suspense
- **Enhanced `fetch` caching**: More granular control
- **Improved error boundaries**: Better error handling
- **Partial Prerendering (PPR)**: Automatic static/dynamic mixing
- **Server Actions improvements**: Better error handling and validation

### Breaking Changes

1. **Turbopack is now default** (no more Webpack)
2. **Minimum Node.js version**: 20.0.0+
3. **Changes to `next/font`**: Different loading behavior
4. **Metadata API changes**: Some properties renamed
5. **Image optimization**: Default formats changed

### Migration Steps

#### 1. Update Dependencies

```bash
pnpm add next@^16.0.0 react@^19.1.0 react-dom@^19.1.0
pnpm add -D @types/react@^19.0.10 @types/react-dom@^19.0.4
```

#### 2. Update `next.config.ts`

**Before:**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Webpack config...
};

export default nextConfig;
```

**After (Turbopack native):**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack is default, no flag needed

  // For PWA with Serwist
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Enable PPR (optional but recommended)
  experimental: {
    ppr: true, // Partial Prerendering
  },
};

export default nextConfig;
```

#### 3. Update Scripts

**package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

No need for `--turbopack` flag - it's default in v16!

#### 4. Test Incremental Adoption

```bash
# Test dev server
pnpm dev

# Test production build
pnpm build
pnpm start
```

### Next.js 16 Codemod

```bash
# Automatic migration
pnpm dlx @next/codemod@latest upgrade latest
```

This will:
- Update `next.config.js/ts`
- Fix deprecated APIs
- Update metadata exports
- Migrate image imports

---

## Tailwind CSS v4 Migration

### What's New in Tailwind v4

**Major Changes:**
- **CSS-first configuration**: `@config` directive in CSS
- **Native CSS variables**: Better browser DevTools integration
- **Lightning CSS**: 10x faster build times
- **Zero-config variants**: More powerful modifiers
- **Improved IntelliSense**: Better autocomplete
- **Smaller runtime**: Optimized for modern browsers

### Breaking Changes

1. **No more `tailwind.config.js`** - Use CSS `@config`
2. **Different color format**: CSS variables instead of RGB
3. **Plugin API changes**: New plugin system
4. **JIT is default**: No production/dev distinction

### Migration Steps

#### 1. Update Dependencies

```bash
pnpm add -D tailwindcss@^4.0.0 @tailwindcss/postcss@^4.0.0
```

#### 2. Convert Config to CSS

**Delete `tailwind.config.ts`**

**Create `src/app/globals.css` (or update existing):**
```css
@import "tailwindcss";

/* Theme configuration */
@theme {
  /* Colors - now using CSS color-mix */
  --color-primary: oklch(0.5 0.2 250);
  --color-secondary: oklch(0.6 0.15 180);

  /* RTL Support */
  --font-sans: 'Noto Sans Arabic', system-ui, sans-serif;

  /* Breakpoints */
  --breakpoint-xs: 475px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* Animations */
  --animate-bounce: bounce 1s infinite;
  --animate-spin: spin 1s linear infinite;
}

/* Custom utilities */
@utility tab-2 {
  tab-size: 2;
}

/* RTL utilities */
@utility rtl-flip {
  [dir="rtl"] & {
    transform: scaleX(-1);
  }
}

/* Base styles */
@layer base {
  html {
    @apply antialiased;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/* Component styles */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium;
    @apply hover:opacity-90 active:scale-95;
    @apply transition-all duration-200;
  }
}
```

#### 3. Update PostCSS Config

**postcss.config.mjs:**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

#### 4. Update Component Classes (if needed)

**Before (v3):**
```tsx
<div className="bg-blue-500/50"> {/* Opacity with slash */}
```

**After (v4 - same syntax, better performance):**
```tsx
<div className="bg-blue-500/50"> {/* Works the same */}
```

#### 5. Migrate Custom Plugins

**Before (`tailwind.config.ts`):**
```typescript
import plugin from 'tailwindcss/plugin';

export default {
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.rtl-flip': {
          '[dir="rtl"] &': {
            transform: 'scaleX(-1)',
          },
        },
      });
    }),
  ],
};
```

**After (`globals.css`):**
```css
@utility rtl-flip {
  [dir="rtl"] & {
    transform: scaleX(-1);
  }
}
```

#### 6. Update IntelliSense

**`.vscode/settings.json`:**
```json
{
  "tailwindCSS.experimental.configFile": "src/app/globals.css",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Codemod for Automated Migration

```bash
# Official migration tool
pnpm dlx @tailwindcss/upgrade@next
```

This will:
- Convert `tailwind.config.js` to CSS `@theme`
- Update `postcss.config.js`
- Migrate plugins to CSS utilities
- Update class names if needed

---

## Zod v4 Migration

### What's New in Zod v4

**Major Improvements:**
- **Better TypeScript inference**: More accurate types
- **Improved error messages**: Clearer validation errors
- **Performance optimizations**: 2x faster parsing
- **New methods**: `z.coerce`, `z.discriminatedUnion` improvements
- **Better tree-shaking**: Smaller bundle size

### Breaking Changes

1. **`z.date()` parsing changed**: Stricter date validation
2. **Removed deprecated methods**: `z.lazy()` syntax changed
3. **Error format changes**: Different error structure

### Migration Steps

#### 1. Update Dependencies

```bash
pnpm add zod@^4.0.0
```

#### 2. Update Schemas (Minimal Changes)

**Before (v3):**
```typescript
import { z } from 'zod';

export const ReciterSchema = z.object({
  id: z.number(),
  name: z.string(),
  moshaf: z.array(
    z.object({
      id: z.number(),
      server: z.string().url(),
    })
  ),
});
```

**After (v4 - mostly compatible):**
```typescript
import { z } from 'zod';

export const ReciterSchema = z.object({
  id: z.coerce.number(), // New: Auto-coerce strings to numbers
  name: z.string().min(1, 'Name required'),
  moshaf: z.array(
    z.object({
      id: z.coerce.number(),
      server: z.string().url(),
    })
  ),
});
```

#### 3. Update Error Handling

**Before:**
```typescript
try {
  ReciterSchema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.errors); // Array of errors
  }
}
```

**After (better error formatting):**
```typescript
const result = ReciterSchema.safeParse(data);

if (!result.success) {
  // Formatted error messages
  const formatted = result.error.format();
  console.log(formatted);

  // Flatten for forms
  const flat = result.error.flatten();
  console.log(flat.fieldErrors);
}
```

#### 4. Use New Features

**Coercion (new in v4):**
```typescript
const SurahIdSchema = z.coerce.number().int().min(1).max(114);

// Automatically converts strings to numbers
SurahIdSchema.parse('42'); // Returns: 42 (number)
```

**Better discriminated unions:**
```typescript
const TrackSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('surah'),
    surahId: z.number(),
  }),
  z.object({
    type: z.literal('playlist'),
    tracks: z.array(z.string()),
  }),
]);
```

### Codemod (if available)

```bash
# Check for official codemod
pnpm dlx zod-migrate@latest
```

---

## i18n Migration (react-intl → next-intl)

### Why next-intl?

**Advantages over react-intl:**
- **Built for Next.js**: Works seamlessly with App Router and RSC
- **Server Component support**: Use translations in Server Components
- **Type-safe translations**: Full TypeScript autocomplete
- **Smaller bundle**: 50% smaller than react-intl
- **Better DX**: Simpler API, less boilerplate
- **Automatic locale detection**: Based on headers/cookies
- **SEO-friendly**: Works with metadata and sitemap

### Migration Strategy

#### 1. Install next-intl

```bash
pnpm add next-intl@^4.0.0
```

#### 2. Setup Configuration

**Create `src/i18n/request.ts`:**
```typescript
import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'ar';

  return {
    locale,
    messages: (await import(`@/locales/${locale}.json`)).default,
  };
});
```

**Update `next.config.ts`:**
```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // ... other config
};

export default withNextIntl(nextConfig);
```

#### 3. Create Middleware

**Create `src/middleware.ts`:**
```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed', // Don't add /ar/ to default locale
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

#### 4. Update Layout

**Before (`src/app/layout.tsx`):**
```typescript
'use client';
import { IntlProvider } from 'react-intl';
import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

export default function RootLayout({ children }) {
  const [locale, setLocale] = useState('ar');
  const messages = locale === 'ar' ? ar : en;

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <IntlProvider locale={locale} messages={messages}>
          {children}
        </IntlProvider>
      </body>
    </html>
  );
}
```

**After (`src/app/[locale]/layout.tsx`):**
```typescript
// Server Component! No 'use client'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['ar', 'en'];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### 5. Migrate Components

**Before (react-intl):**
```typescript
'use client';
import { FormattedMessage, useIntl } from 'react-intl';

export function Hero() {
  const { formatMessage } = useIntl();

  return (
    <div>
      <h1>
        <FormattedMessage
          id="hero.title"
          defaultMessage="Welcome"
        />
      </h1>
      <p>{formatMessage({ id: 'hero.subtitle' })}</p>
    </div>
  );
}
```

**After (next-intl) - Server Component:**
```typescript
import { getTranslations } from 'next-intl/server';

export async function Hero() {
  const t = await getTranslations('hero');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

**After (next-intl) - Client Component:**
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function Hero() {
  const t = useTranslations('hero');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

#### 6. Type-Safe Translations

**Generate types from JSON:**
```bash
pnpm add -D next-intl-types
```

**Update `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "next-intl/plugin",
        "messagesPath": "./src/locales"
      }
    ]
  }
}
```

**Now you get autocomplete!**
```typescript
const t = useTranslations('hero');
t('title'); // ✅ Autocomplete!
t('invalid'); // ❌ TypeScript error
```

#### 7. Update JSON Structure (Optional)

**Before (`src/locales/ar.json`):**
```json
{
  "hero.title": "مرحباً",
  "hero.subtitle": "استمع للقرآن"
}
```

**After (nested, recommended):**
```json
{
  "hero": {
    "title": "مرحباً",
    "subtitle": "استمع للقرآن"
  }
}
```

#### 8. Language Switcher Component

```typescript
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    // Add new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <button onClick={() => switchLocale(locale === 'ar' ? 'en' : 'ar')}>
      {locale === 'ar' ? 'English' : 'العربية'}
    </button>
  );
}
```

### Migration Checklist

- [ ] Install `next-intl`
- [ ] Create `i18n/request.ts`
- [ ] Update `next.config.ts`
- [ ] Create middleware
- [ ] Convert `app/layout.tsx` to `app/[locale]/layout.tsx`
- [ ] Migrate all components:
  - [ ] Replace `<FormattedMessage>` with `t()`
  - [ ] Replace `useIntl()` with `useTranslations()`
  - [ ] Convert client components to server components where possible
- [ ] Update language switcher
- [ ] Test both locales thoroughly
- [ ] Remove `react-intl` dependency

---

## UI Components with shadcn/ui

### Why shadcn/ui?

**Philosophy:**
- **Not a component library**: Copy-paste components into your codebase
- **Full ownership**: Customize without limits
- **Built on Radix UI**: Accessible by default (WCAG 2.1 AA)
- **Tailwind CSS styling**: Consistent with your design system
- **TypeScript-first**: Full type safety
- **Server Component compatible**: Works with Next.js App Router
- **RTL support**: Works with Arabic layouts

### Installation & Setup

#### 1. Initialize shadcn/ui

```bash
pnpm dlx shadcn@latest init
```

**Configuration prompts:**
```
✔ Would you like to use TypeScript? … yes
✔ Which style would you like to use? › New York
✔ Which color would you like to use as base color? › Slate
✔ Where is your global CSS file? › src/app/globals.css
✔ Would you like to use CSS variables for colors? … yes
✔ Are you using a custom tailwind prefix? … no
✔ Where is your tailwind.config located? › Use CSS @theme
✔ Configure the import alias for components? › @/components
✔ Configure the import alias for utils? › @/utils
✔ Are you using React Server Components? … yes
```

**This creates:**
- `components/ui/` folder
- `lib/utils.ts` (cn helper - you already have this!)
- Updated `globals.css` with theme variables

#### 2. Add Components

```bash
# Add only what you need
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add slider
pnpm dlx shadcn@latest add tooltip
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add skeleton
```

#### 3. Customize Theme for Open Tarteel

**Update `src/app/globals.css`:**
```css
@theme {
  /* Open Tarteel Brand Colors */
  --color-primary: oklch(0.45 0.2 250); /* Islamic blue */
  --color-secondary: oklch(0.55 0.15 150); /* Islamic green */
  --color-accent: oklch(0.65 0.18 30); /* Gold accent */

  /* Semantic colors */
  --color-background: oklch(0.98 0 0);
  --color-foreground: oklch(0.15 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.15 0 0);
  --color-muted: oklch(0.95 0 0);
  --color-muted-foreground: oklch(0.45 0 0);

  /* Borders & inputs */
  --color-border: oklch(0.9 0 0);
  --color-input: oklch(0.9 0 0);
  --color-ring: oklch(0.45 0.2 250);

  /* States */
  --color-destructive: oklch(0.55 0.22 25);
  --color-destructive-foreground: oklch(0.98 0 0);
}

[dir="rtl"] {
  /* RTL-specific adjustments */
  --space-x-reverse: 1;
}
```

#### 4. Migrate Existing Components

**Before (Custom Button):**
```typescript
// components/button.tsx
export function Button({ children, onClick }) {
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**After (shadcn Button):**
```typescript
import { Button } from '@/components/ui/button';

export function PlayButton({ onClick }) {
  return (
    <Button variant="default" size="lg" onClick={onClick}>
      <PlayIcon className="me-2" />
      تشغيل
    </Button>
  );
}
```

**Available variants:**
- `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

#### 5. Example: Reciter Selection Dialog

**Install required components:**
```bash
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add scroll-area
```

**Migrate `reciter-selector-dialog.tsx`:**
```typescript
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { Reciter } from '@/types';

interface ReciterSelectorDialogProps {
  reciters: Reciter[];
  onSelect: (reciter: Reciter) => void;
}

export function ReciterSelectorDialog({
  reciters,
  onSelect
}: ReciterSelectorDialogProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = reciters.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">اختر القارئ</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>اختر القارئ</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن القارئ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filtered.map((reciter) => (
              <Button
                key={reciter.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onSelect(reciter);
                  setOpen(false);
                }}
              >
                {reciter.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
```

#### 6. Example: Audio Player Controls

```bash
pnpm dlx shadcn@latest add slider
pnpm dlx shadcn@latest add tooltip
```

```typescript
'use client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

export function PlayerControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([80]);

  return (
    <div className="flex items-center gap-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <SkipBack className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>السورة السابقة</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ?
                <Pause className="h-6 w-6" /> :
                <Play className="h-6 w-6" />
              }
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPlaying ? 'إيقاف' : 'تشغيل'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <SkipForward className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>السورة التالية</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center gap-2 ms-auto">
        <Volume2 className="h-5 w-5" />
        <Slider
          value={volume}
          onValueChange={setVolume}
          max={100}
          step={1}
          className="w-32"
        />
      </div>
    </div>
  );
}
```

#### 7. RTL Support

Shadcn components work with RTL out of the box, but you can enhance:

```css
/* src/app/globals.css */
[dir="rtl"] {
  /* Flip icons that need it */
  .lucide-arrow-right {
    transform: scaleX(-1);
  }

  /* Adjust positioning */
  .tooltip {
    /* Tooltips automatically flip */
  }
}
```

#### 8. Customize Components

Since components are in your codebase, customize freely:

```typescript
// components/ui/button.tsx
// Add new variant for Islamic design
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        islamic: "bg-gradient-to-r from-blue-600 to-green-600 text-white",
        // ... other variants
      },
    },
  }
);
```

### Recommended Components for Open Tarteel

```bash
# Core UI
pnpm dlx shadcn@latest add button dialog sheet tooltip

# Forms
pnpm dlx shadcn@latest add input select slider switch

# Feedback
pnpm dlx shadcn@latest add toast skeleton progress

# Navigation
pnpm dlx shadcn@latest add tabs dropdown-menu

# Layout
pnpm dlx shadcn@latest add card separator scroll-area

# Data Display
pnpm dlx shadcn@latest add badge avatar table
```

### Migration Priority

1. **High Priority** (user-facing):
   - `<Button>` → Replace all custom buttons
   - `<Dialog>` → Reciter selector, settings
   - `<Slider>` → Volume, seek bar
   - `<Tooltip>` → Control buttons

2. **Medium Priority**:
   - `<Select>` → Riwaya filter, sort options
   - `<Input>` → Search bar
   - `<ScrollArea>` → Reciter lists, playlist

3. **Low Priority**:
   - `<Tabs>` → Settings pages
   - `<Toast>` → Notifications
   - `<Badge>` → Riwaya tags

---

## PWA & Offline-First (Serwist + Turbopack)

### Serwist 10 with Next.js 16 & Turbopack

**What's New:**
- **Native Turbopack support**: No Webpack config needed
- **Better service worker generation**: Smaller, faster
- **Improved caching strategies**: More granular control
- **Background sync v2**: Better offline experience

### Migration from Serwist 9 to 10

#### 1. Update Dependencies

```bash
pnpm add -D @serwist/next@^10.0.0 serwist@^10.0.0
```

#### 2. New Configuration (Turbopack-native)

**Create `serwist.config.ts` (new location):**
```typescript
import type { SerwistConfig } from '@serwist/next';

const config: SerwistConfig = {
  cacheOnNavigation: true,
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',

  // Turbopack-specific
  experimental: {
    turbo: true,
  },

  // Runtime caching
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/www\.mp3quran\.net\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'quran-api',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/.*\.mp3$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'quran-audio',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        rangeRequests: true, // Critical for audio
        plugins: [
          {
            // Show download progress
            fetchDidSucceed: async ({ response }) => {
              const clonedResponse = response.clone();
              const reader = clonedResponse.body?.getReader();
              // ... progress tracking
              return response;
            },
          },
        ],
      },
    },
  ],
};

export default config;
```

**Update `next.config.ts`:**
```typescript
import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';

const nextConfig: NextConfig = {
  // ... your config
};

export default withSerwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  disable: process.env.NODE_ENV === 'development',
  register: true,
})(nextConfig);
```

#### 3. Update Service Worker

**`src/sw.ts`:**
```typescript
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// Type declarations
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Background sync for favorites
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

async function syncFavorites() {
  // Sync favorites with server/Gun.js
  const favorites = await getLocalFavorites();
  await sendToServer(favorites);
}

serwist.addEventListeners();
```

#### 4. Register Service Worker (Client)

**`src/app/layout.tsx`:**
```typescript
import { PWAUpdater } from '@/components/pwa-updater';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <PWAUpdater />
      </body>
    </html>
  );
}
```

**`src/components/pwa-updater.tsx`:**
```typescript
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'; // or your toast library

export function PWAUpdater() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                toast.info('تحديث جديد متوفر', {
                  action: {
                    label: 'تحديث',
                    onClick: () => updateServiceWorker(),
                  },
                });
              }
            });
          }
        });
      });
    }
  }, []);

  const updateServiceWorker = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return null; // Toast handles UI
}
```

#### 5. Offline Fallback Page

**`public/offline.html`:**
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>غير متصل - Open Tarteel</title>
  <style>
    body {
      font-family: 'Noto Sans Arabic', system-ui;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; }
  </style>
</head>
<body>
  <div>
    <h1>🌙 غير متصل بالإنترنت</h1>
    <p>يرجى التحقق من اتصالك بالإنترنت</p>
  </div>
</body>
</html>
```

**Add to `sw.ts`:**
```typescript
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
```

---

## State Management Migration

### Current: Jotai 2.11.1

**Pros:**
- Atomic, minimalist API
- Good TypeScript support
- Small bundle size (~3KB)

**Cons:**
- Client-side only (no SSR hydration)
- Requires `'use client'` for all atom-consuming components
- Limited DevTools compared to alternatives
- Steep learning curve for atom dependencies
- No middleware ecosystem

### Recommended: Zustand 5.x

**Why Zustand?**
- **Better SSR/RSC story**: Can hydrate state from server
- **Simpler mental model**: Single store vs atomic atoms
- **Middleware ecosystem**: persist, devtools, immer, subscribeWithSelector
- **Better performance**: Fewer re-renders with selector pattern
- **Smaller API surface**: Easier onboarding for contributors
- **Works with React 19 Actions**: Seamless integration

### Migration Strategy

#### 1. Install Zustand
```bash
npm install zustand
```

#### 2. Convert Atoms to Store

**Before (Jotai):**
```typescript
// src/jotai/atom.ts
import { createAtomWithStorage } from '@/jotai/create-atom-with-storage';

export const selectedReciterAtom = createAtomWithStorage<Reciter | null>(
  'selectedReciter',
  null
);

export const isPlayingAtom = createAtomWithStorage<boolean>(
  'isPlaying',
  false
);
```

**After (Zustand):**
```typescript
// src/stores/player-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Reciter } from '@/types';

interface PlayerState {
  selectedReciter: Reciter | null;
  isPlaying: boolean;
  setSelectedReciter: (reciter: Reciter | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      selectedReciter: null,
      isPlaying: false,
      setSelectedReciter: (reciter) => set({ selectedReciter: reciter }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

#### 3. Update Component Usage

**Before:**
```typescript
'use client';
import { useAtom } from 'jotai';
import { isPlayingAtom } from '@/jotai/atom';

export function Player() {
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  // ...
}
```

**After:**
```typescript
'use client';
import { usePlayerStore } from '@/stores/player-store';

export function Player() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  // More performant - only re-renders when isPlaying changes
}
```

#### 4. SSR Hydration (Optional but Powerful)

```typescript
// src/stores/player-store.ts (enhanced)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'player-storage',
      skipHydration: true, // Manually control hydration
    }
  )
);

// Then in layout or provider:
'use client';
import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/player-store';

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    usePlayerStore.persist.rehydrate();
  }, []);

  return children;
}
```


## PWA & Offline-First Improvements

### Current: Serwist 9.0.12

**Issues:**
- Configuration complexity
- Limited control over caching strategies
- Next.js integration sometimes breaks

## Audio Management Modernization

### Current: Plain HTML5 Audio Element

**Issues:**
- No buffering visualization
- Limited control over streaming
- No gapless playback
- No crossfade support

### Recommended: Howler.js 2.2.4

```bash
npm install howler
npm install --save-dev @types/howler
```

**Why Howler?**
- HTML5 Audio + Web Audio API hybrid
- Cross-browser compatibility (Safari issues handled)
- Gapless playback support
- Sprite support for Surah chunks
- Better mobile handling
- Active development

#### Implementation Example

```typescript
// src/hooks/use-audio-player.ts
import { useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';
import type { Playlist } from '@/types';

export function useAudioPlayer() {
  const [sound, setSound] = useState<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const loadPlaylist = (playlist: Playlist[]) => {
    // Clean up previous sound
    sound?.unload();

    const newSound = new Howl({
      src: playlist.map(item => item.link),
      html5: true, // Enable streaming
      preload: 'metadata', // Don't load entire file
      format: ['mp3'],
      onload: () => {
        setDuration(newSound.duration());
      },
      onplay: () => {
        setIsPlaying(true);
        requestAnimationFrame(updateProgress);
      },
      onpause: () => setIsPlaying(false),
      onend: () => {
        // Auto-play next in playlist
        if (newSound._sprite.__default[2] < playlist.length - 1) {
          newSound.play();
        }
      },
    });

    setSound(newSound);
  };

  const updateProgress = () => {
    if (sound && isPlaying) {
      setCurrentTime(sound.seek());
      requestAnimationFrame(updateProgress);
    }
  };

  return {
    loadPlaylist,
    play: () => sound?.play(),
    pause: () => sound?.pause(),
    seek: (time: number) => sound?.seek(time),
    setVolume: (volume: number) => Howler.volume(volume),
    isPlaying,
    currentTime,
    duration,
  };
}
```

### Alternative: Tone.js (Advanced Use Cases)

If you need visualizations, effects, or precise timing:

```bash
npm install tone
```

**Use case**: Tajweed highlighting synchronized with audio

---


## P2P Sync Alternatives

### Current: Gun.js 0.2020.1241

**Issues:**
- Very outdated (2020 version)
- Poor TypeScript support
- Large bundle size (~150KB)
- Difficult to debug
- Security concerns with public peers

### Recommended: Y.js + y-indexeddb

**Why Y.js?**
- Industry standard CRDT (Notion, Figma use it)
- Excellent TypeScript support
- Smaller bundle (~30KB with providers)
- Multiple sync providers (WebRTC, WebSocket, IndexedDB)
- Battle-tested

#### Installation

```bash
npm install yjs y-indexeddb y-webrtc
```

#### Implementation

```typescript
// src/sync/yjs-favorites.ts
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';

export class FavoritesSync {
  private doc: Y.Doc;
  private favorites: Y.Map<boolean>;
  private indexeddbProvider: IndexeddbPersistence;
  private webrtcProvider?: WebrtcProvider;

  constructor(userId: string) {
    this.doc = new Y.Doc();
    this.favorites = this.doc.getMap('favorites');

    // Local persistence
    this.indexeddbProvider = new IndexeddbPersistence(
      `favorites-${userId}`,
      this.doc
    );

    // P2P sync (optional, can disable for privacy)
    if (navigator.onLine) {
      this.webrtcProvider = new WebrtcProvider(
        `open-tarteel-favorites-${userId}`,
        this.doc,
        { signaling: ['wss://signaling.yjs.dev'] }
      );
    }
  }

  addFavorite(reciterId: string) {
    this.favorites.set(reciterId, true);
  }

  removeFavorite(reciterId: string) {
    this.favorites.delete(reciterId);
  }

  getFavorites(): string[] {
    return Array.from(this.favorites.keys());
  }

  onChange(callback: (favorites: string[]) => void) {
    this.favorites.observe(() => {
      callback(this.getFavorites());
    });
  }

  destroy() {
    this.indexeddbProvider.destroy();
    this.webrtcProvider?.destroy();
    this.doc.destroy();
  }
}
```

#### Zustand Integration

```typescript
// src/stores/favorites-store.ts
import { create } from 'zustand';
import { FavoritesSync } from '@/sync/yjs-favorites';

interface FavoritesState {
  favorites: Set<string>;
  sync: FavoritesSync | null;
  initSync: (userId: string) => void;
  addFavorite: (reciterId: string) => void;
  removeFavorite: (reciterId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set(),
  sync: null,

  initSync: (userId: string) => {
    const sync = new FavoritesSync(userId);

    sync.onChange((favorites) => {
      set({ favorites: new Set(favorites) });
    });

    set({ sync, favorites: new Set(sync.getFavorites()) });
  },

  addFavorite: (reciterId: string) => {
    const { sync, favorites } = get();
    sync?.addFavorite(reciterId);
    set({ favorites: new Set([...favorites, reciterId]) });
  },

  removeFavorite: (reciterId: string) => {
    const { sync, favorites } = get();
    sync?.removeFavorite(reciterId);
    favorites.delete(reciterId);
    set({ favorites: new Set(favorites) });
  },
}));
```

---

## Build & Tooling Upgrades

### 1. Enable Turbopack (Stable in Next.js 15)

Already available via `npm run dev:turbo`

**Benefits:**
- 10x faster than Webpack
- Built in Rust
- Better HMR
- Incremental compilation

**Make it default:**
```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack"
  }
}
```


### 3. Upgrade Testing Stack

**Add Playwright for E2E:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Example E2E Test:**
```typescript
// e2e/player.spec.ts
import { test, expect } from '@playwright/test';

test('can select reciter and play audio', async ({ page }) => {
  await page.goto('/');

  // Wait for reciters to load
  await page.waitForSelector('[data-testid="reciter-card"]');

  // Click first reciter
  await page.click('[data-testid="reciter-card"]:first-child');

  // Should navigate to player
  await expect(page).toHaveURL(/\/reciter\/.+/);

  // Play button should be visible
  await expect(page.locator('[data-testid="play-button"]')).toBeVisible();

  // Click play
  await page.click('[data-testid="play-button"]');

  // Audio should start (check if playing state changes)
  await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();
});
```

---

## TypeScript & Type Safety

### 1. Enable Strict Mode Fully

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,  // Prevent array[0] being undefined
    "exactOptionalPropertyTypes": true,  // undefined ≠ missing property
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 2. Use Zod for Runtime Validation

```bash
npm install zod
```

**src/types/reciter.ts:**
```typescript
import { z } from 'zod';

export const ReciterSchema = z.object({
  id: z.number(),
  name: z.string(),
  letter: z.string().optional(),
  moshaf: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      server: z.string().url(),
      surah_total: z.number(),
      surah_list: z.string(),
    })
  ),
});

export type Reciter = z.infer<typeof ReciterSchema>;

// In API:
export async function getAllReciters() {
  const response = await fetch('https://www.mp3quran.net/api/v3/reciters');
  const data = await response.json();

  // Runtime validation
  return z.array(ReciterSchema).parse(data.reciters);
}
```

### 3. Use Template Literal Types

```typescript
// src/types/surah.ts
export type SurahId = `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 /* ... to 114 */}`;
export type AudioFormat = 'mp3' | 'ogg' | 'opus';
export type AudioQuality = '64kbps' | '128kbps' | '192kbps';

export type AudioUrl = `https://${string}.mp3quran.net/${string}.${AudioFormat}`;

// Now you get autocomplete and type safety!
const url: AudioUrl = 'https://server.mp3quran.net/surah.mp3'; // ✅
const bad: AudioUrl = 'http://server.mp3quran.net/surah.mp3'; // ❌ Type error
```

---

## Performance Optimization

### 1. Image Optimization (Missing)

**Add `next/image` for reciter photos:**
```typescript
import Image from 'next/image';

export function ReciterCard({ reciter }: { reciter: Reciter }) {
  return (
    <div>
      <Image
        src={`/images/reciters/${reciter.id}.jpg`}
        alt={reciter.name}
        width={200}
        height={200}
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate with plaiceholder
      />
    </div>
  );
}
```

### 2. Route Prefetching Strategy

**app/layout.tsx:**
```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Preconnect to API & CDN */}
        <link rel="preconnect" href="https://www.mp3quran.net" />
        <link rel="dns-prefetch" href="https://www.mp3quran.net" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3. Virtualized Lists for Reciters

```bash
npm install @tanstack/react-virtual
```

**components/reciters-list-virtualized.tsx:**
```typescript
'use client';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { Reciter } from '@/types';

export function RecitersList({ reciters }: { reciters: Reciter[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: reciters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const reciter = reciters[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ReciterCard reciter={reciter} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Performance Gain**: Render only visible items (~10) instead of all 200+ reciters

---

## Package Version Upgrades

### High Priority Updates

```bash
# State Management
npm install zustand@5.0.3

# Audio
npm install howler@2.2.4
npm install --save-dev @types/howler

# P2P Sync (Gun.js replacement)
npm install yjs@13.6.18 y-indexeddb@9.0.12 y-webrtc@10.3.0

# i18n (react-intl replacement)
npm install next-intl@3.29.2
npm uninstall react-intl

# Testing
npm install --save-dev @playwright/test@1.49.1

# Validation
npm install zod@3.24.1

# Performance
npm install @tanstack/react-virtual@3.12.0

# Tooling (optional but recommended)
npm install --save-dev @biomejs/biome@1.9.4
```

### Remove Deprecated/Unused

```bash
# If migrating away from Jotai
npm uninstall jotai jotai-devtools

# If migrating to Biome
npm uninstall eslint prettier eslint-config-prettier \
  eslint-plugin-prettier prettier-plugin-tailwindcss

# If migrating away from Serwist
npm uninstall @serwist/next

# Gun.js (after Y.js migration)
npm uninstall gun
```

---

## Migration Roadmap

### Phase 1: Foundation & Quick Wins (1-2 weeks)

1. ✅ **Migrate to pnpm** (package manager)
2. 🔧 **Upgrade to Next.js 16** (stable release)
3. 🔧 **Initialize shadcn/ui** and add core components
4. 🔧 **Update Serwist to v10** with Turbopack support
5. 🔧 **Migrate to Tailwind CSS v4** (CSS-first config)
6. 🔧 **Add Zod v4** for API validation
7. 🔧 **Add Playwright E2E tests** (critical paths)

**Effort**: Low-Medium | **Impact**: High

### Phase 2: i18n & State Management (2-3 weeks)

1. 🔄 **Migrate to next-intl** from react-intl
2. 🔄 **Convert layout to `[locale]` structure**
3. 🔄 **Migrate all components** to use `useTranslations()`
4. 🔄 **Install Zustand** with persist middleware
5. 🔄 **Create new stores** (player, favorites, settings)
6. 🔄 **Migrate components** from Jotai atoms
7. 🔄 **Remove Jotai** and react-intl dependencies
8. 🔄 **Convert more components to RSC**

**Effort**: High | **Impact**: Very High

### Phase 3: UI Components & Audio (3-4 weeks)

1. 🎨 **Migrate existing components to shadcn/ui**
   - Replace custom Button, Dialog, Slider, Tooltip
   - Add Input, Select, ScrollArea components
2. 🎵 **Migrate to Howler.js** for audio
3. 🎵 **Implement gapless playback**
4. 🎵 **Add audio visualizations** (optional)
5. 📱 **Enhance PWA** with background sync
6. 📱 **Implement periodic sync**
7. 🔧 **Implement virtualized lists** for performance

**Effort**: High | **Impact**: High

### Phase 4: P2P Sync (4-5 weeks)

1. 🌐 **Set up Y.js** infrastructure
2. 🌐 **Migrate favorites** to Y.js
3. 🌐 **Add WebRTC provider** for P2P
4. 🌐 **Test sync** across devices
5. 🌐 **Remove Gun.js**

**Effort**: High | **Impact**: Medium

### Phase 5: Polish & Optimization (Ongoing)

1. ⚡ **Performance audits** with Lighthouse
2. ⚡ **Bundle size optimization**
3. ⚡ **Accessibility improvements**
4. ⚡ **SEO enhancements**
5. ⚡ **Analytics integration**

**Effort**: Medium | **Impact**: Medium

---

## Breaking Changes & Considerations

### State Management Migration

**Breaking Changes:**
- All `useAtom` calls must be replaced with `usePlayerStore`
- Storage keys may change (can migrate with a one-time script)
- Jotai DevTools no longer work (use Redux DevTools for Zustand)

**Migration Path:**
```typescript
// src/utils/migrate-storage.ts
export function migrateJotaiToZustand() {
  const oldData = {
    selectedReciter: localStorage.getItem('selectedReciter'),
    isPlaying: localStorage.getItem('isPlaying'),
    // ... other atoms
  };

  // Combine into Zustand format
  const newData = {
    state: oldData,
    version: 0,
  };

  localStorage.setItem('player-storage', JSON.stringify(newData));

  // Clean up old keys
  Object.keys(oldData).forEach(key => localStorage.removeItem(key));
}
```

### Audio Migration

**Breaking Changes:**
- Audio element refs will be different (Howl instance instead of HTMLAudioElement)
- Some browser APIs may behave differently
- Need to test extensively on Safari/iOS

### i18n Migration (Optional)

**react-intl → next-intl:**
```typescript
// Before
<FormattedMessage id="home.title" defaultMessage="Home" />

// After
{t('home.title')}
```

**Benefits:**
- Better Next.js integration
- Server Component support
- Smaller bundle size
- Type-safe translations

---

## Testing Strategy

### Current: Vitest (Unit Tests Only)

**Proposed Multi-Layer Testing:**

```
┌─────────────────────────────────────┐
│   E2E Tests (Playwright)            │  Critical user flows
│   - Login, Play Audio, Favorites    │  10-15 tests
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│   Integration Tests (Vitest + RTL)  │  Component interactions
│   - Player + Playlist + Controls    │  30-40 tests
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│   Unit Tests (Vitest)               │  Pure functions
│   - Utils, Hooks, Stores            │  100+ tests (current)
└─────────────────────────────────────┘
```

**Coverage Goals:**
- Unit: 80%+
- Integration: 60%+
- E2E: Critical paths (5-10 scenarios)

---

## Conclusion

This comprehensive modernization guide provides a strategic roadmap for upgrading Open Tarteel to use cutting-edge technologies while maintaining stability and user experience. The suggested migrations are prioritized by impact and effort, allowing for incremental adoption.

**Key Recommendations Summary:**

1. **📦 Migrate to pnpm** - 3x faster installs, better monorepo support (Week 1)
2. **⚡ Upgrade to Next.js 16** - Turbopack stable, better RSC support (Week 1)
3. **🎨 Adopt Tailwind CSS v4** - CSS-first config, Lightning CSS (Week 1-2)
4. **🌐 Switch to next-intl** - Better Next.js integration, type-safe (Week 2-3)
5. **🎯 Migrate to Zustand** - Better DX, SSR support, middleware (Week 3-4)
6. **🎨 Implement shadcn/ui** - Accessible, customizable components (Week 4-6)
7. **🎵 Upgrade to Howler.js** - Better audio experience (Week 6-7)
8. **✅ Add Zod v4 validation** - Runtime type safety (Week 1)
9. **🔧 Update Serwist to v10** - Turbopack native PWA (Week 1-2)
10. **🌐 Consider Y.js** - Only if P2P sync is critical (Week 8+)

**Estimated Total Effort**: 14-18 weeks (can be done incrementally)

**Expected Outcomes:**
- **40% faster builds** (pnpm + Turbopack + Tailwind v4)
- **50% smaller bundle** (Zustand, next-intl, Howler, Y.js vs current stack)
- **Better TypeScript DX** (Zod v4, next-intl type-safety)
- **More maintainable codebase** (shadcn/ui, simpler state management)
- **Enhanced user experience** (gapless playback, better PWA, accessible UI)
- **Improved i18n** (Server Components, type-safe translations)
- **Future-proof architecture** (Next.js 16, React 19 patterns)

**Quick Start Checklist** (Do these first):
- [ ] Week 1: Migrate to pnpm
- [ ] Week 1: Upgrade to Next.js 16
- [ ] Week 1: Add Zod v4 validation
- [ ] Week 1-2: Update Serwist to v10
- [ ] Week 1-2: Migrate to Tailwind CSS v4
- [ ] Week 2-3: Implement next-intl
- [ ] Week 2: Initialize shadcn/ui
- [ ] Week 3-4: Migrate to Zustand

**Breaking Changes to Prepare For:**
- Next.js 16: Turbopack is default (no Webpack fallback)
- Tailwind v4: Config moves from JS to CSS
- next-intl: Layout structure changes to `[locale]`
- Zustand: Different API from Jotai atoms
- shadcn/ui: Components in your repo (not node_modules)

---

**Questions or need help with migration?** Open an issue on GitHub with the `modernization` label.

**Want to contribute?** Check our [CONTRIBUTING.md](CONTRIBUTING.md) and start with "good first issue" labeled tasks.
