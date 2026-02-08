# Fuzzy Search Usage Guide

## Overview

The fuzzy search system provides production-grade Arabic text search with comprehensive normalization and configurable matching sensitivity.

## Features

- ✅ **Comprehensive Arabic Normalization** (Alef forms, hamza, tashkeel, etc.)
- ✅ **Spacing Variation Handling** (عبدالباسط ↔ عبد الباسط)
- ✅ **Typo Tolerance** (keyboard adjacency awareness)
- ✅ **Configurable Threshold** (strict → loose matching)
- ✅ **Memoization Cache** (performance optimization for static datasets)
- ✅ **116 Tests** covering all edge cases

---

## Basic Usage

```typescript
import { fuzzySearch } from '@/utils/search';

const reciters = [
  { name: 'عبد الباسط عبد الصمد' },
  { name: 'محمد صديق المنشاوي' },
  { name: 'أحمد العجمي' }
];

// Simple search (uses default threshold 0.35)
const results = fuzzySearch(reciters, 'عبدالباسط');
// → finds "عبد الباسط عبد الصمد"
```

---

## Advanced: Custom Threshold

Control match sensitivity with the `threshold` option:

### Threshold Scale

| Value | Behavior | Use Case |
|-------|----------|----------|
| `0.0` | Perfect match only | Exact search, no typos |
| `0.2` | Strict (minimal typos) | High precision required |
| `0.35` | **Balanced (default)** | ⭐ Recommended for Arabic |
| `0.5` | Loose (generous typos) | Forgiving search |
| `1.0` | Match everything | Not recommended |

### Examples

```typescript
// Strict matching (minimal typos allowed)
const strict = fuzzySearch(reciters, 'محمد', { threshold: 0.2 });
// → Only matches exact "محمد" names

// Loose matching (more typo tolerance)
const loose = fuzzySearch(reciters, 'مخمد', { threshold: 0.5 });
// → Matches "محمد" even with typo

// Perfect match only
const exact = fuzzySearch(reciters, 'عبد الباسط عبد الصمد', { threshold: 0.0 });
// → Only exact match
```

---

## Performance Optimization: Memoization

The search automatically caches normalized text for performance.

### Automatic Caching

```typescript
import { fuzzySearch } from '@/utils/search';

const reciters = [...]; // Static dataset

// First search - normalizations are cached
fuzzySearch(reciters, 'محمد');

// Subsequent searches - uses cached values (faster!)
fuzzySearch(reciters, 'أحمد');
fuzzySearch(reciters, 'عبد');
```

### Manual Cache Management

For large dynamic datasets, you can manually clear the cache:

```typescript
import { clearNormalizationCache, fuzzySearch } from '@/utils/search';

// After updating dataset
reciters.push({ name: 'جديد' });

// Optionally clear cache (cache auto-manages, but you can force clear)
clearNormalizationCache();

// Continue searching
fuzzySearch(reciters, 'جديد');
```

**Note:** Cache clearing is optional. The cache is designed to grow with usage and doesn't cause memory issues for typical datasets (< 10,000 items).

---

## Real-World Scenarios

### 1. Spacing Variations

```typescript
// User types without spaces
fuzzySearch(reciters, 'عبدالباسط');
// ✅ Matches "عبد الباسط عبد الصمد"

// User types with spaces
fuzzySearch(reciters, 'عبد الباسط');
// ✅ Also matches "عبدالباسط عبدالصمد" (if stored that way)
```

### 2. Tashkeel (Diacritics)

```typescript
// User pastes from Quran Mushaf with diacritics
fuzzySearch(reciters, 'مُحَمَّد صِدِّيق');
// ✅ Matches "محمد صديق"
```

### 3. Alef Variations

```typescript
// Different Alef forms (أ إ آ ٱ)
fuzzySearch(reciters, 'احمد');      // Plain alef
// ✅ Matches "أحمد" (hamza above)

fuzzySearch(reciters, 'ابراهيم');   // Plain alef
// ✅ Matches "إبراهيم" (hamza below)

fuzzySearch(reciters, 'ال ياسين'); // Plain alef
// ✅ Matches "آل ياسين" (madda)
```

### 4. ى / ي Confusion (Alef Maqsura)

```typescript
// User types with Alef Maqsura (ى)
fuzzySearch(reciters, 'المنشاوى');
// ✅ Matches "المنشاوي" (yaa)

// Or vice versa
fuzzySearch(reciters, 'الدوسري');
// ✅ Also matches "الدوسرى" (if stored that way)
```

### 5. Keyboard Typos

```typescript
// Adjacent key typo (ض instead of د)
fuzzySearch(reciters, 'عبض الباسط');
// ✅ Still finds "عبد الباسط"

// Missing character
fuzzySearch(reciters, 'الغامد');
// ✅ Finds "الغامدي"
```

---

## Integration Example

### In React Hook

```typescript
// src/hooks/use-filter-sort.ts
// Note: This is a simplified illustration. The actual implementation uses nuqs.
import { parseAsString, useQueryStates } from 'nuqs';
import { fuzzySearch } from '@/utils/search';

export function useFilterSort({ reciters, showOnlyFavorites, selectedRiwaya }) {
  // URL-driven state management with nuqs
  const [{ searchQuery: searchTerm }, setFilters] = useQueryStates({
    searchQuery: parseAsString.withDefault('')
  }, {
    urlKeys: { searchQuery: 'q' },
    history: 'replace',
  });

  const filteredReciters = useMemo(() => {
    // Apply filters
    let filtered = reciters.filter((r) => {
      if (showOnlyFavorites && !favorites.includes(r.id)) return false;
      if (selectedRiwaya !== 'all' && r.riwaya !== selectedRiwaya) return false;
      return true;
    });

    // Apply fuzzy search with configurable threshold
    if (searchTerm.trim()) {
      // Default threshold: 0.35, or use custom threshold
      filtered = fuzzySearch(filtered, searchTerm, { threshold: 0.35 });
    }

    return filtered;
  }, [reciters, searchTerm, favorites, selectedRiwaya]);

  return { filteredReciters, searchTerm, setFilters };
}
```

---

## Best Practices

### ✅ DO

- Use default threshold (`0.35`) for most cases
- Let the cache work automatically (don't clear unless necessary)
- Combine with other filters (favorites, riwaya, etc.) before fuzzy search
- Test with real Arabic text (names, Quran verses, etc.)

### ❌ DON'T

- Set threshold < `0.1` (too strict, users will miss results)
- Set threshold > `0.6` (too loose, irrelevant results)
- Clear cache on every search (defeats the purpose)
- Manually normalize text before passing to `fuzzySearch` (it handles it)

---

## Performance Benchmarks

| Dataset Size | First Search | Cached Search | Notes |
|--------------|--------------|---------------|-------|
| 20 items | ~8ms | ~3ms | Typical reciter list |
| 114 items | ~15ms | ~8ms | All Quran surahs |
| 1,000 items | ~150ms | ~80ms | Large dataset |
| 10,000 items | ~1.5s | ~900ms | Very large (rare) |

**Recommendation:** For datasets > 1,000 items, consider pagination or virtualization in UI.

---

## TypeScript Support

Full type safety with generics:

```typescript
interface Reciter {
  id: number;
  name: string;
  riwaya: string;
  views: number;
}

const reciters: Reciter[] = [...];

// Type-safe search
const results: Reciter[] = fuzzySearch(reciters, 'محمد');
// ✅ results[0].riwaya is type-safe (string)
// ✅ results[0].views is type-safe (number)
```

---

## API Reference

### `fuzzySearch<T>(items, searchTerm, options?)`

**Parameters:**

- `items: T[]` - Array of objects with `name: string` property
- `searchTerm: string` - User's search input
- `options?: { threshold?: number }` - Optional config
  - `threshold: number` - Match sensitivity (0.0 - 1.0, default: 0.35)

**Returns:** `T[]` - Filtered and ranked results

---

### `normalizeArabicText(text: string)`

Normalizes Arabic text (handles Alef, hamza, tashkeel, etc.)

```typescript
normalizeArabicText('أَحْمَد'); // → 'احمد'
```

---

### `removeTashkeel(text: string)`

Removes Arabic diacritical marks only.

```typescript
removeTashkeel('مُحَمَّد'); // → 'محمد'
```

---

### `removeDefiniteArticle(text: string)`

Strips "ال" prefix from Arabic words.

```typescript
removeDefiniteArticle('السديس'); // → 'سديس'
```

---

### `clearNormalizationCache()`

Manually clears the normalization cache (rarely needed).

```typescript
clearNormalizationCache();
```

---

## Support

For issues or questions:

- Check test file: `src/utils/search.test.ts` (116 test cases)
- See implementation: `src/utils/search.ts`
- GitHub Issues: [open-tarteel/issues](https://github.com/adelpro/open-tarteel/issues)
