import { type NextRequest, NextResponse } from 'next/server';

import { DEFAULT_LOCALE, localeFromPath, stripLocale } from '@/lib/seo/routes';

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

  if (locale === DEFAULT_LOCALE) {
    // Passing a cloned header bag through `NextResponse.next` loses the
    // downstream 404 status in Next 15.5, so mutate the request headers in
    // place for the bare (Arabic) tree.
    request.headers.set('x-tarteel-locale', locale);
    return NextResponse.next();
  }

  // Dynamic reciter routes are canonicalised Arabic documents. The explicit
  // /en and /de files redirect to the Arabic page; rewriting them into the bare
  // dynamic route made Next answer 404.
  if (pathname.startsWith(`/${locale}/reciter/`)) {
    return NextResponse.next();
  }

  const response = NextResponse.rewrite(
    new URL(`${stripLocale(pathname)}${search}`, request.url),
    { request: { headers: requestHeaders } }
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
