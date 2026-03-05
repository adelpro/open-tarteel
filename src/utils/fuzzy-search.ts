import { normalizeArabicText } from './index';

/**
 * Fuzzy search scorer for Arabic reciter names
 * Returns score between 0-1 (1 = perfect match)
 */
export const fuzzyScoreReciter = (
  reciterName: string,
  query: string
): number => {
  if (!query.trim()) return 1;

  const normalizedName = normalizeArabicText(reciterName).toLowerCase();
  const normalizedQuery = normalizeArabicText(query).toLowerCase();

  // Exact match = perfect score
  if (
    normalizedName === normalizedQuery ||
    normalizedName.includes(normalizedQuery)
  ) {
    return 1;
  }

  // Fuzzy scoring: character-by-character matching with position bonuses
  let score = 0;
  let queryIndex = 0;

  for (
    let index = 0;
    index < normalizedName.length && queryIndex < normalizedQuery.length;
    index++
  ) {
    if (normalizedName[index] === normalizedQuery[queryIndex]) {
      score += 1;
      // Bonus for start-of-query and end-of-query matches
      if (queryIndex === 0 || queryIndex === normalizedQuery.length - 1) {
        score += 0.5;
      }
      queryIndex++;
    }
  }

  return score / normalizedQuery.length;
};

/**
 * Default threshold for "good enough" fuzzy match
 */
export const FUZZY_SEARCH_THRESHOLD = 0.6;
