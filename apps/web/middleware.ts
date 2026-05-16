import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/servers', '/settings'];
const authPrefixes = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('discord_token')?.value;
  const pathname = request.nextUrl.pathname;

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (authPrefixes.some((prefix) => pathname.startsWith(prefix)) && token) {
    const appUrl = new URL('/', request.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/servers/:path*', '/settings/:path*', '/auth/login', '/auth/register'],
};

