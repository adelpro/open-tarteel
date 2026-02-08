import Fuse, {
  type FuseResult,
  type IFuseOptions,
} from 'fuse.js';

export const removeTashkeel = (text: string): string => {
  return (
    text
      // Replace wasl sign (ٱ) with regular alef (ا)
      .replaceAll('ٱ', '\u0627')
      // Remove all tashkeel (harakat) and extra diacritics
      .replaceAll(
        /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06FC]/g,
        ''
      )
  );
};

/**
 * Normalizes Arabic text by removing diacritics and standardizing characters
 */
export const normalizeArabicText = (text: string): string => {
  if (!text) return '';

  let normalizedText = removeTashkeel(text); // Remove tashkeel using the new function
  normalizedText = normalizedText
    .replaceAll(/[\u0622\u0623\u0625]/g, '\u0627') // Normalize alef
    .replaceAll(/[\u0624\u0626]/g, '\u0621') // Normalize hamza
    .replaceAll('ى', '\u064A') // Normalize ya/alif maqsura
    .replaceAll('ـ', '') // Remove tatweel
    .replaceAll(/[\u0654\u0655]/g, '\u0621') // Normalize hamza above/below
    .replaceAll('ة', 'ه'); // NEW: Normalize Taa Marbuta to هاء

  return normalizedText;
};

/**
 * Fuzzy search configuration for Fuse.js
 */
const fuseOptions: IFuseOptions<{ name: string }> = {
  keys: ['name'],
  threshold: 0.4, // 0 = perfect match, 1 = match anything
  distance: 100, // Maximum distance between characters
  minMatchCharLength: 2, // Minimum characters that must match
  ignoreLocation: true, // Search entire string, not just beginning
  includeScore: true,
  useExtendedSearch: false,
};

/**
 * Performs fuzzy search on items with Arabic text normalization
 * @param items - Array of items to search (must have a 'name' property)
 * @param searchTerm - The search term to match against
 * @returns Filtered array of items that match the search term
 */
export function fuzzySearch<T extends { name: string }>(
  items: T[],
  searchTerm: string
): T[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return items;
  }

  const normalizedSearchTerm = normalizeArabicText(searchTerm);

  // Normalize all item names for search
  const normalizedItems = items.map((item) => ({
    ...item,
    name: normalizeArabicText(item.name),
  }));

  // Create Fuse instance with normalized items
  const fuse = new Fuse(normalizedItems, fuseOptions);

  // Perform search with normalized search term
  const results = fuse.search(normalizedSearchTerm);

  // Return original items (not normalized ones, not FuseResult objects)
  // Map back to original items using index
  return results.map((result: FuseResult<typeof normalizedItems[0]>) => {
    const index = normalizedItems.indexOf(result.item);
    return items[index];
  });
}
