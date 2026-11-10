import { type NextRequest, NextResponse } from 'next/server';

import { isReciterRoute, RECITER_ROUTE_COOKIE } from '@/lib/reciter-route';
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

  // Returning listeners go straight to their player. The cookie only exists
  // after a client selection, so first-time visitors and crawlers still get
  // the server-rendered home.
  if (pathname === '/') {
    const cookie = request.cookies.get(RECITER_ROUTE_COOKIE)?.value;
    if (cookie) {
      try {
        const target = decodeURIComponent(cookie);
        if (isReciterRoute(target)) {
          return NextResponse.redirect(new URL(target, request.url));
        }
      } catch {
        // Malformed cookie: fall through and render the home page.
      }
    }
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

  const stripped = stripLocale(pathname);
  // A protocol-relative path such as `/en//evil.example` would resolve against
  // the attacker's origin. Only same-origin paths may be rewritten.
  if (stripped.startsWith('//')) {
    return NextResponse.next();
  }

  const target = request.nextUrl.clone();
  target.pathname = stripped;
  target.search = search;

  return NextResponse.rewrite(target, {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
