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
