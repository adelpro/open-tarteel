import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/'],
};

export function middleware(request: NextRequest) {
  console.log('Root middleware running for path:', request.nextUrl.pathname);
  return NextResponse.redirect(new URL('/ar', request.url));
}
