import { NextResponse, type NextRequest } from 'next/server';

import {
  DEFAULT_LOCALE,
  localeFromPath,
  stripLocale,
} from '@/lib/seo/routes';

const PUBLIC_FILE =
  /\.(?:png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|otf|css|js|mjs|map|xml|txt|webmanifest)$/i;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/sw.js' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const locale = localeFromPath(pathname);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tarteel-locale', locale);

  const response =
    locale === DEFAULT_LOCALE
      ? NextResponse.next({ request: { headers: requestHeaders } })
      : NextResponse.rewrite(
          new URL(`${stripLocale(pathname)}${search}`, request.url),
          { request: { headers: requestHeaders } }
        );

  if (locale !== DEFAULT_LOCALE) {
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
