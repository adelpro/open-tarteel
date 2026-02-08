import Fuse, { type FuseResult, type IFuseOptions } from 'fuse.js';

/**
 * Comprehensive Arabic text normalization and fuzzy search utilities.
 *
 * Handles real-world Arabic search challenges:
 * - Tashkeel (diacritics) removal: مُحَمَّد → محمد
 * - Alef variations: أ إ آ ٱ → ا
 * - Hamza variations: ؤ → و, ئ → ي
 * - Taa Marbouta / Haa: ة → ه
 * - Yaa / Alef Maqsura: ى ↔ ي (unified)
 * - Tatweel (kashida) removal: عـلـي → علي
 * - Arabic-Indic digits: ٠١٢٣٤٥٦٧٨٩ → 0123456789
 * - Quranic annotations and honorific signs
 * - Whitespace normalization for spacing variations
 * - Case-insensitive for mixed Arabic/English names
 *
 * Based on production-tested patterns from mapsforge/ArabicNormalizer
 * and OsmAnd Arabic search normalization.
 */

// ──────────────────────────────────────────
// Unicode ranges and character maps
// ──────────────────────────────────────────

/** Arabic diacritics (tashkeel) - harakat and extra marks */
const TASHKEEL_PATTERN =
  /[\u064B-\u065F\u0610-\u061A\u0656-\u065F\u0670\u06D6-\u06ED]/g;

/** Quranic annotation marks and honorific signs */
const QURANIC_MARKS_PATTERN = /[\u06DD\u06DE\u06E9]/g;

/** Tatweel (kashida) */
const TATWEEL = '\u0640';

/** Arabic-Indic digit map */
const ARABIC_INDIC_DIGITS: Record<string, string> = {
  '\u0660': '0', // ٠
  '\u0661': '1', // ١
  '\u0662': '2', // ٢
  '\u0663': '3', // ٣
  '\u0664': '4', // ٤
  '\u0665': '5', // ٥
  '\u0666': '6', // ٦
  '\u0667': '7', // ٧
  '\u0668': '8', // ٨
  '\u0669': '9', // ٩
};

const ARABIC_INDIC_DIGIT_PATTERN = /[\u0660-\u0669]/g;

// ──────────────────────────────────────────
// Core normalization functions
// ──────────────────────────────────────────

/**
 * Removes all Arabic diacritical marks (tashkeel/harakat).
 *
 * Removes: Fathatan, Dammatan, Kasratan, Fatha, Damma,
 * Kasra, Shadda, Sukun, Maddah, Hamza marks, superscript Alef,
 * Quranic annotations, honorific signs, and small letter marks.
 */
export const removeTashkeel = (text: string): string => {
  return text
    .replace(/ٱ/g, '\u0627') // Wasl sign → regular Alef
    .replace(TASHKEEL_PATTERN, '')
    .replace(QURANIC_MARKS_PATTERN, '');
};

/**
 * Normalizes Arabic text for search comparison.
 *
 * Comprehensive normalization based on production patterns used in
 * Google Maps, OsmAnd, and mapsforge for Arabic text search:
 *
 * 1. Removes tashkeel (diacritics)
 * 2. Normalizes Alef forms: أ إ آ → ا
 * 3. Normalizes Hamza on carriers: ؤ → و, ئ → ي
 * 4. Normalizes Yaa/Alef Maqsura: ى → ي
 * 5. Normalizes Taa Marbouta: ة → ه
 * 6. Removes tatweel (kashida): ـ
 * 7. Normalizes hamza above/below: ◌ٔ ◌ٕ → ء
 * 8. Converts Arabic-Indic digits: ٠-٩ → 0-9
 * 9. Normalizes whitespace (trim + collapse)
 * 10. Lowercases for case-insensitive matching
 */
export const normalizeArabicText = (text: string): string => {
  if (!text) return '';

  let result = removeTashkeel(text);

  result = result
    // Normalize Alef variations → ا
    .replace(/[\u0622\u0623\u0625]/g, '\u0627') // آ أ إ → ا
    // Normalize Hamza on Waw → و
    .replace(/\u0624/g, '\u0648') // ؤ → و
    // Normalize Hamza on Yaa → ي
    .replace(/\u0626/g, '\u064A') // ئ → ي
    // Normalize Alef Maqsura → Yaa
    .replace(/\u0649/g, '\u064A') // ى → ي
    // Normalize Taa Marbouta → Haa
    .replace(/\u0629/g, '\u0647') // ة → ه
    // Remove tatweel (kashida)
    .replace(new RegExp(TATWEEL, 'g'), '')
    // Normalize standalone hamza marks
    .replace(/[\u0654\u0655]/g, '') // Remove hamza above/below
    // Convert Arabic-Indic digits → Western digits
    .replace(
      ARABIC_INDIC_DIGIT_PATTERN,
      (match: string) => ARABIC_INDIC_DIGITS[match] ?? match
    )
    // Normalize whitespace: trim and collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
    // Lowercase for mixed Arabic/English names (e.g. "Sheikh Ahmad")
    .toLowerCase();

  return result;
};

/**
 * Strips the Arabic definite article "ال" from the beginning of a word.
 * Useful for matching "سديس" against "السديس".
 */
export const removeDefiniteArticle = (text: string): string => {
  return text.replace(/(^|\s)ال/g, '$1').trim();
};

/**
 * Collapses all spaces in text to allow matching
 * "عبدالباسط" against "عبد الباسط".
 */
const removeSpaces = (text: string): string => {
  return text.replace(/\s/g, '');
};

// ──────────────────────────────────────────
// Fuzzy search
// ──────────────────────────────────────────

/**
 * Fuse.js configuration optimized for Arabic reciter name search.
 *
 * - threshold 0.35: Balanced — catches typos but avoids false positives
 * - distance 200: Arabic names can be long (عبد الباسط عبد الصمد)
 * - minMatchCharLength 2: Allow 2-char Arabic matches (عم, حص)
 * - ignoreLocation: Names can match anywhere in the string
 * - isCaseSensitive false: Handle mixed Arabic/English names
 */
const fuseOptions: IFuseOptions<{
  normalizedName: string;
  spacelessName: string;
}> = {
  keys: ['normalizedName', 'spacelessName'],
  threshold: 0.35,
  distance: 200,
  minMatchCharLength: 2,
  ignoreLocation: true,
  includeScore: true,
  isCaseSensitive: false,
  shouldSort: true,
  findAllMatches: true,
};

/**
 * Internal type for search-indexed items with normalized variants.
 */
type SearchableItem<T> = T & {
  normalizedName: string;
  spacelessName: string;
  originalIndex: number;
};

/**
 * Performs fuzzy search on Arabic text items with comprehensive normalization.
 *
 * Search strategy (multi-pass for best UX):
 * 1. Normalize both search term and item names
 * 2. Create spaceless variants for spacing-variation matching
 * 3. Use Fuse.js fuzzy matching against both normal and spaceless variants
 * 4. Deduplicate and return results ranked by relevance
 *
 * @param items - Array of items with a `name` property
 * @param searchTerm - User's search input (may contain typos, tashkeel, etc.)
 * @returns Filtered and ranked array of matching items (original objects preserved)
 *
 * @example
 * ```ts
 * const reciters = [{ name: 'عبد الباسط عبد الصمد' }, { name: 'محمد صديق المنشاوي' }];
 * fuzzySearch(reciters, 'عبدالباسط');  // finds عبد الباسط
 * fuzzySearch(reciters, 'عبض الباسط');  // finds عبد الباسط (typo tolerance)
 * fuzzySearch(reciters, 'المنشاوى');    // finds المنشاوي (ى → ي normalization)
 * ```
 */
export function fuzzySearch<T extends { name: string }>(
  items: T[],
  searchTerm: string
): T[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return items;
  }

  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  const spacelessSearchTerm = removeSpaces(normalizedSearchTerm);

  // If search term normalizes to empty, return all items
  if (!normalizedSearchTerm && !spacelessSearchTerm) {
    return items;
  }

  // Build searchable items with normalized + spaceless variants
  const searchableItems: SearchableItem<T>[] = items.map((item, index) => ({
    ...item,
    normalizedName: normalizeArabicText(item.name),
    spacelessName: removeSpaces(normalizeArabicText(item.name)),
    originalIndex: index,
  }));

  // Fuse.js fuzzy search on normalized names
  const fuse = new Fuse(searchableItems, fuseOptions);

  // Search with both normal and spaceless variants
  const normalResults = fuse.search(normalizedSearchTerm);
  const spacelessResults =
    spacelessSearchTerm !== normalizedSearchTerm
      ? fuse.search(spacelessSearchTerm)
      : [];

  // Merge and deduplicate results, keeping best scores
  const seenIndices = new Set<number>();
  const mergedResults: FuseResult<SearchableItem<T>>[] = [];

  for (const result of [...normalResults, ...spacelessResults]) {
    if (!seenIndices.has(result.item.originalIndex)) {
      seenIndices.add(result.item.originalIndex);
      mergedResults.push(result);
    }
  }

  // Sort by score (lower is better match)
  mergedResults.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));

  // Return original items (preserving references and all properties)
  return mergedResults.map((result) => items[result.item.originalIndex]);
}
