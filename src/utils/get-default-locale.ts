/**
 * Returns the default locale ('ar' or 'en') based on the provided language string
 * (from Accept-Language header or navigator.language).
 *
 * If the language is Arabic (or starts with 'ar'), returns 'ar'.
 * If the language is English or any other language (fr, tr, de, es, etc.), returns 'en'.
 */
export function getDefaultLocale(
  langHeaderOrNavLang?: string | null
): 'ar' | 'en' {
  if (!langHeaderOrNavLang) return 'en';
  const lower = langHeaderOrNavLang.toLowerCase().trim();
  if (
    lower.startsWith('ar') ||
    lower.includes('ar-') ||
    lower.includes('ar,')
  ) {
    return 'ar';
  }
  return 'en';
}
