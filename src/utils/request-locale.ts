import { cookies, headers } from 'next/headers';

import { resolveLocale } from '@/lib/seo/locale';

/**
 * The locale of the current server request.
 *
 * The middleware sets `x-tarteel-locale` for both bare and prefixed paths, so
 * a crawler never gets a different document because of `Accept-Language`.
 */
export async function getRequestLocale() {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  return resolveLocale(
    headerStore.get('x-tarteel-locale'),
    headerStore.get('accept-language'),
    cookieStore.get('locale')?.value ?? null
  );
}
