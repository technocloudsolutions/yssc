import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that don't require authentication
const publicPaths = ['/auth/login', '/api/auth', '/login'];

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get('user')?.value;
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without authentication
  if (!currentUser && !isPublicPath) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing login while authenticated
  if (currentUser && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add role-based access control
  if (currentUser) {
    const user = JSON.parse(currentUser);
    
    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/settings') && user.role.toLowerCase() !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 