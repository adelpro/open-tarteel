export async function getMessages(
  locale: string
): Promise<Record<string, string> | null> {
  try {
    console.log('locale', locale);
    const arabicMessages = await import(`@/locales/ar.json`);
    const englishMessages = await import(`@/locales/en.json`);
    return locale === 'en' ? englishMessages.default : arabicMessages.default;
  } catch {
    throw new Error(`Missing messages for locale: ${locale}`);
  }
}
