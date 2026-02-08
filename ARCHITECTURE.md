# Architecture — Open Tarteel

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (PWA Client)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js App Router (CSR)                 │   │
│  │  ┌───────────────────────────────────────────────┐   │   │
│  │  │  IntlProviderWrapper (react-intl, ar/en)      │   │   │
│  │  │  ┌────────────────────────────────────────┐   │   │   │
│  │  │  │  HtmlWrapper (RTL/LTR, lang attribute) │   │   │   │
│  │  │  │  ┌─────────────────────────────────┐   │   │   │   │
│  │  │  │  │  RootLayout (Jotai Provider)    │   │   │   │   │
│  │  │  │  │  ┌──────────────────────────┐   │   │   │   │   │
│  │  │  │  │  │  Page Components         │   │   │   │   │   │
│  │  │  │  │  └──────────────────────────┘   │   │   │   │   │
│  │  │  │  └─────────────────────────────────┘   │   │   │   │
│  │  │  └────────────────────────────────────────┘   │   │   │
│  │  └───────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │ Service Worker│ │  Jotai Store │ │  Gun.js (P2P sync)  │  │
│  │  (Serwist)   │ │ (localStorage│ │  favorites + views  │  │
│  │ Audio caching│ │  persisted)  │ │                     │  │
│  └──────┬───────┘ └──────────────┘ └────────┬────────────┘  │
└─────────┼──────────────────────────────────────┼────────────┘
          │                                      │
          │                                      │
┌─────────▼──────────────────────────────────────▼────────────┐
│                   External Services                          │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  MP3Quran API    │  │ Gun Relay    │  │  SMTP Server  │  │
│  │  /api/v3/reciters│  │ Peers        │  │  (Feedback)   │  │
│  │  Audio CDN       │  │              │  │               │  │
│  └──────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
IntlProviderWrapper                     ← react-intl context
  └── HtmlWrapper                       ← <html lang/dir>
       └── body
            └── main
                 ├── ExitFullscreen     ← (fullscreen only)
                 ├── LanguageSwitcher   ← AR/EN toggle (non-fullscreen)
                 ├── [Page Content]     ← varies by route
                 └── Footer            ← bottom nav (non-fullscreen)
```

### Home Page (`/`)

```
Home
  ├── Hero                              ← Logo + title + description
  ├── ReciterSelector                   ← Selected reciter display + search trigger
  │    └── ReciterSelectorDialog        ← Modal with search/filter/sort
  │         ├── Filter Bar (Riwaya)
  │         ├── Sort Controls
  │         └── RecitersList
  │              └── ReciterCard[]      ← Individual reciter cards
  └── UnderConstruction                 ← Dev notice banner
```

### Reciter Page (`/reciter/[id]`)

```
ReciterPage
  ├── Hero                              ← Logo (hidden in fullscreen)
  ├── ReciterSelector                   ← Change reciter (non-fullscreen)
  ├── Reciter Name                      ← (fullscreen only)
  └── Player                            ← Core audio player
       ├── <audio>                      ← HTML5 audio element
       ├── AudioBarsVisualizer          ← Real-time audio visualization
       ├── PlayerControls               ← Play/pause/next/prev/volume/speed/sleep
       ├── Range                        ← Seek slider + progress
       ├── PlaylistDialog               ← Surah list modal
       │    └── Playlist                ← Surah items
       ├── TrackInfo                    ← Current surah name + time
       └── PwaUpdater                   ← SW update notification
```

---

## Data Flow

### 1. Reciter Loading Flow

```
Page Mount
  → useReciters() hook
    → getAllReciters(locale) → fetch MP3Quran API
      → Transform API response to Reciter[] type
        → Each API moshaf → generatePlaylist() → PlaylistItem[]
        → Extract riwaya from moshaf name
      → setReciters(data)
      → Re-sync selectedReciter from atom (if exists)
```

### 2. Audio Playback Flow

```
User selects reciter → selectedReciterAtom updated
  → Home redirects to /reciter/[id]
  → ReciterPage reads selectedReciterAtom
    → Player receives playlist prop
      → currentTrack state → audio src set
        → <audio> element plays
          → handleTimeUpdate → currentTimeAtom
          → handleTrackEnded → getNextTrackIndex (respects playbackMode)
          → useMediaSession → OS-level metadata + controls
```

### 3. Favorites Sync Flow

```
User toggles favorite
  → useFavorites().toggleFavorite(favId)
    → Update favoriteRecitersAtom (local Jotai/localStorage)
    → syncFavorite(favId, isFavorited) → Gun.js
      → Increment/decrement global count
      → Broadcast to all connected peers

On mount:
  → fetchFavoriteCounts() → Gun.js snapshot
  → subscribeToFavoriteCounts() → Real-time Gun.js updates
```

### 4. Internationalization Flow

```
LanguageSwitcher click
  → localeAtom toggles ('ar' ↔ 'en')
    → IntlProviderWrapper re-renders with new locale + messages
      → HtmlWrapper updates lang + dir attributes
        → All <FormattedMessage> components re-render
```

---

## State Architecture (Jotai)

```
                    ┌─────────────────────────────┐
                    │    createAtomWithStorage()    │
                    │   (atomWithStorage + custom   │
                    │    createStorage adapter)     │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼──────┐ ┌────────▼────────┐ ┌────────▼────────┐
    │  UI State       │ │  Player State   │ │  User Prefs     │
    │                 │ │                 │ │                  │
    │ fullscreenAtom  │ │ currentTimeAtom │ │ localeAtom       │
    │ showVisualizer  │ │ playbackSpeed   │ │ selectedRiwaya   │
    │ hideUnderConst  │ │ playbackMode    │ │ recitersSortAtom │
    │                 │ │ volumeAtom      │ │ favoriteReciters │
    └─────────────────┘ │ selectedReciter │ └──────────────────┘
                        └─────────────────┘
```

All atoms auto-persist to `localStorage` and auto-restore on page load via `{ getOnInit: true }`.

---

## Service Worker Architecture

```
sw.ts (Serwist)
  ├── Precache: Auto-generated manifest (build artifacts)
  ├── Runtime Caching:
  │    ├── quranAudioCache (CacheFirst)
  │    │    ├── Match: *.mp3quran.net/server*/NNN.mp3
  │    │    ├── Strategy: CacheFirst
  │    │    ├── Max entries: 20
  │    │    └── Max age: 7 days
  │    └── defaultCache (Serwist defaults)
  ├── skipWaiting: true
  ├── clientsClaim: true
  └── navigationPreload: true
```

---

## Page Rendering Strategy

| Route             | Server Component (`page.tsx`)                    | Client Component                    |
| ----------------- | ------------------------------------------------- | ------------------------------------ |
| `/`               | ❌ (fully client)                                 | `page.tsx` (Home)                   |
| `/reciter/[id]`   | ✅ generateStaticParams + generateMetadata + SEO  | `reciter-page.tsx` (ReciterPage)    |
| `/about`          | Minimal server wrapper                            | `about-page.tsx` (AboutPage)        |
| `/contact`        | Minimal server wrapper                            | `contact-page.tsx` (ContactPage)    |
| `/privacy`        | Minimal server wrapper                            | `privacy-page.tsx` (PrivacyPage)    |

### SSG Pre-rendering

The reciter detail page (`/reciter/[id]`) uses `generateStaticParams` to pre-render all known reciter pages at build time, providing SEO-optimized metadata (OpenGraph, Twitter Cards, JSON-LD) for each reciter.

---

## Security Considerations

- **HTML sanitization**: `sanitize-html` used for user-generated content
- **CORS**: Audio element uses `crossOrigin="anonymous"`
- **Rate limiting**: API route limits to 5 requests/minute/IP
- **Environment isolation**: Sensitive config (SMTP) in server-only env vars
- **Content Security**: No `dangerouslySetInnerHTML` except for JSON-LD schema
