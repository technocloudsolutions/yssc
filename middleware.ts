import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

// Paths that require admin role
const adminOnlyPaths = [
  '/settings/roles',
  '/settings/permissions',
  '/settings/system'
];

const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => path.startsWith(publicPath));
};

const isAdminOnlyPath = (path: string) => {
  return adminOnlyPaths.some(adminPath => path.startsWith(adminPath));
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check if the path is public
  if (isPublicPath(pathname)) {
    // If user is already authenticated and tries to access login page,
    // redirect them to dashboard
    const userCookie = request.cookies.get('user');
    if (userCookie && pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  try {
    // Get the user cookie
    const userCookie = request.cookies.get('user');

    // If no user cookie exists, redirect to login
    if (!userCookie) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }

    // Parse user data from cookie
    const userData = JSON.parse(userCookie.value);

    // Check for admin-only routes
    if (isAdminOnlyPath(pathname)) {
      if (userData.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Allow access to all other routes for authenticated users
    return NextResponse.next();
  } catch (error) {
    // If there's an error parsing the cookie, redirect to login
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 