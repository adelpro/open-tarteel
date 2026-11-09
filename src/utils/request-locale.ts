import { headers } from 'next/headers';

import { resolveLocale } from '@/lib/seo/locale';

/**
 * The locale of the current server request.
 *
 * The middleware sets `x-tarteel-locale` for both bare and prefixed paths. A
 * missing header means a bare (Arabic) path, so crawlers never get a different
 * document because of `Accept-Language` or a stale cookie.
 */
export async function getRequestLocale() {
  const headerStore = await headers();
  return resolveLocale(headerStore.get('x-tarteel-locale'), null, null);
}
