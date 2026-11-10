import { DEFAULT_LOCALE, LOCALES, type SeoLocale } from './routes';

const isLocale = (value: string | null | undefined): value is SeoLocale =>
  Boolean(value && (LOCALES as readonly string[]).includes(value));

const fromAcceptLanguage = (value: string | null): SeoLocale | null => {
  if (!value) return null;
  const first = value.split(',')[0]?.trim().toLowerCase();
  if (!first) return null;
  const base = first.split('-')[0];
  if (base === 'ar') return 'ar';
  if (base === 'en') return 'en';
  if (base === 'de') return 'de';
  return null;
};

/**
 * Resolve the request language. The middleware header is authoritative for
 * URL-prefixed pages; the cookie and browser language are fallbacks for
 * unprefixed pages. Unsupported values fall back to Arabic.
 */
export const resolveLocale = (
  headerLocale: string | null | undefined,
  acceptLanguage: string | null | undefined,
  cookieLocale: string | null | undefined
): SeoLocale => {
  if (isLocale(headerLocale)) return headerLocale;
  if (isLocale(cookieLocale)) return cookieLocale;
  return fromAcceptLanguage(acceptLanguage ?? null) ?? DEFAULT_LOCALE;
};
