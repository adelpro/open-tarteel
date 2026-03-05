# Offline Audio Caching System

## Overview

Open Tarteel now includes an offline caching system that allows users to download and listen to Quranic audio surahs without an internet connection. This feature significantly improves the user experience, especially in areas with poor connectivity.

## Architecture

### Components

1. **Audio Cache Utility** (`src/utils/audio-cache.ts`)
   - Core service for managing cache operations
   - Uses IndexedDB for metadata storage
   - Uses Cache API for audio blob storage
   - 30-day cache expiration policy

2. **Audio Cache Hook** (`src/hooks/use-audio-cache.ts`)
   - React hook providing cache management interface
   - Handles loading, caching, and removal operations
   - Provides cache statistics (size, count, available space)

3. **Service Worker** (`src/sw.ts`)
   - Implements NetworkFirst strategy for audio requests
   - Falls back to cached content when offline
   - 10-second network timeout before fallback

4. **UI Components**
   - `CacheManager`: Shows cache statistics and allows clearing cache
   - `CacheSurahButton`: Allows caching individual surahs
   - `OfflineIndicator`: Displays online/offline status

## How It Works

### Caching Flow

```
User Action (Cache Button)
    ↓
cacheSurah() Hook
    ↓
cacheAudioFile() Utility (per file)
    ↓
Fetch audio from network
    ↓
Store in Cache API (blob)
    ↓
Store metadata in IndexedDB
    ↓
UI updates with cache status
```

### Serving Cached Content

```
Audio Request
    ↓
Service Worker (NetworkFirst)
    ↓
Try Network (10s timeout)
    ↓
If timeout/offline: Check Cache
    ↓
Serve from Cache API
```

## Storage Details

### IndexedDB Schema
- **Database**: `open-tarteel-cache`
- **Store**: `audio-cache`
- **Fields**:
  - `url`: Audio file URL (primary key)
  - `surahId`: Surah identifier
  - `reciterId`: Reciter identifier
  - `reciterName`: Reciter name
  - `surahName`: Surah name
  - `cachedAt`: Timestamp of caching
  - `fileSize`: File size in bytes

### Cache Storage
- **Cache Name**: `audio-cache-v1`
- **Max Age**: 30 days
- **Strategy**: NetworkFirst with 10s timeout

## Usage Examples

### Component Integration

```tsx
import CacheSurahButton from '@/components/cache-surah-button';

// In your component
<CacheSurahButton
  surahId="1"
  surahName="Al-Fatiha"
  playlist={reciterPlaylist}
  reciterId={reciter.id}
  reciterName={reciter.name}
  compact={true}
/>
```

### Hook Usage

```tsx
import { useAudioCache } from '@/hooks/use-audio-cache';

function MyComponent() {
  const { cacheStats, cachedEntries, cacheSurah, clearCache } = useAudioCache();

  // Check cache size
  console.log(`Cached: ${cacheStats.entriesCount} items`);
  console.log(`Used space: ${cacheStats.totalSize} bytes`);

  // Cache a surah
  await cacheSurah(
    playlist,
    '1',
    'Al-Fatiha',
    1,
    'Reciter Name',
    (current, total) => {
      console.log(`Progress: ${current}/${total}`);
    }
  );
}
```

## Performance Considerations

1. **Download Size**: Each surah can range from 500KB to 2MB depending on recitation
2. **Storage Limit**: Typical device storage: 50GB+ (more than adequate)
3. **Network Timeout**: 10 seconds - balances responsiveness with offline capability
4. **Background**: Downloads happen in background without blocking playback

## Browser Support

- Chrome/Edge: Full support (Cache API + IndexedDB + Service Workers)
- Firefox: Full support
- Safari: Partial support (Service Workers available on iOS 16.1+)
- Mobile browsers: Full support on modern versions

## User Experience

### First Time User
1. App downloads and caches app shell
2. User opens a recitation
3. Optional: User taps cache button on surah to download for offline

### Returning User Offline
1. App loads from cache
2. Previously downloaded surahs available to play
3. Download buttons disabled ("No network")
4. All playback features work normally

### Offline to Online Transition
1. Offline indicator shows "Back Online"
2. User can resume downloading surahs
3. Existing cache remains unchanged

## Storage Management

### Cache Limits
- No hard limit on number of cached surahs (depends on device)
- Cache automatically expires after 30 days
- Users can manually clear cache via Cache Manager

### Estimated Sizes
- Single surah: 1-2 MB
- Single reciter (30 surahs): 30-60 MB
- All 15 reciters: 450-900 MB

## API Reference

### `useAudioCache()` Hook

```typescript
interface UseAudioCacheReturn {
  // State
  cacheStats: CacheStats;
  cachedEntries: CacheEntry[];
  loading: boolean;
  error: string | null;
  operation: 'idle' | 'caching' | 'removing';

  // Methods
  refreshCache(): Promise<void>;
  checkIfCached(url: string): Promise<boolean>;
  cacheAudio(url, metadata, onProgress?): Promise<void>;
  cacheSurah(playlist, surahId, surahName, reciterId, reciterName, onProgress?): Promise<void>;
  removeCached(url: string): Promise<void>;
  removeSurahCache(surahId: string): Promise<void>;
  removeReciterCache(reciterId: number): Promise<void>;
  clearCache(): Promise<void>;
}
```

### Utility Functions

```typescript
// In src/utils/audio-cache.ts
cacheAudioFile(url, metadata): Promise<void>
isCached(url): Promise<boolean>
getCacheEntry(url): Promise<CacheEntry | null>
removeCachedAudio(url): Promise<void>
getAllCachedEntries(): Promise<CacheEntry[]>
getCacheStats(): Promise<CacheStats>
clearAllCache(): Promise<void>
formatBytes(bytes): string
```

## Testing

### Manual Testing Checklist
- [ ] Cache a surah successfully
- [ ] Verify it appears in Cache Manager
- [ ] Go offline and play cached surah
- [ ] Return online and see indicator
- [ ] Clear individual cache entry
- [ ] Clear all cache
- [ ] Verify storage size shown correctly

### Browser DevTools
- IndexedDB: DevTools → Application → IndexedDB → open-tarteel-cache
- Cache Storage: DevTools → Application → Cache Storage → audio-cache-v1
- Service Worker: DevTools → Application → Service Workers

## Future Enhancements

1. **Selective Cache**: Choose which recitations to cache
2. **Auto-cache**: Automatically cache listened surahs
3. **Sync Across Devices**: Cloud sync of cache metadata
4. **Bandwidth Control**: Limit cache downloads to WiFi only
5. **Smart Cleanup**: Auto-delete oldest cache when storage low
6. **Background Sync**: Queue downloads for when user is online

## Security & Privacy

- All caches stored locally - no server transmission
- Cache persists with user browser profile
- Clearing cache doesn't affect other data
- Cache API respects CORS headers

## Troubleshooting

### Cache Not Working
1. Check if Service Worker is registered (DevTools → Application)
2. Verify browser supports Cache API and IndexedDB
3. Check available storage (DevTools → Application → Storage)

### Offline Playback Not Working
1. Confirm file was actually cached (check IndexedDB)
2. Verify audio URL hasn't changed
3. Check browser's offline mode (F12 → Network tab)

### Storage Issues
1. Check available device storage
2. Compare used storage with expected size
3. Clear cache and retry

## Related Files
- Service Worker: `src/sw.ts`
- Player Component: `src/components/player.tsx`
- Types: `src/types/index.ts`
- Localization: `src/locales/ar.json`, `src/locales/en.json`
