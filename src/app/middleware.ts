import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

const PUBLIC_FILE = /\.(.*)$/;
const locales = ['en', 'ar'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware running for path:', pathname);

  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    PUBLIC_FILE.test(pathname)
  ) {
    console.log('Skipping public file:', pathname);
    return;
  }

  // Redirect root '/' to '/ar' explicitly
  if (pathname === '/') {
    const url = new URL('/ar', request.url);
    console.log('Redirecting to:', url.toString());
    return NextResponse.redirect(url);
  }

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    // Fallback detection: default to 'ar' if not 'en'
    const acceptLang = request.headers.get('accept-language') ?? '';
    const locale = acceptLang.startsWith('en') ? 'en' : 'ar';
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }
}
