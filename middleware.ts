import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n/config';
import { createServerClient } from '@supabase/ssr';

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/tasks', '/store', '/settings'];

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/auth/callback'];

// Semi-protected routes (require auth but accessible)
const semiProtectedRoutes = ['/onboarding'];

export async function middleware(request: NextRequest) {
  // First handle i18n
  const response = intlMiddleware(request);

  // Create a Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  // Get the pathname without locale prefix
  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/(en-US|ko-KR)/, '');

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );
  const isSemiProtectedRoute = semiProtectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect logic
  if ((isProtectedRoute || isSemiProtectedRoute) && !user) {
    // Redirect to login if trying to access protected route without auth
    const locale = pathname.split('/')[1];
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (isPublicRoute && user && !pathnameWithoutLocale.startsWith('/auth/callback')) {
    // Redirect to dashboard if already logged in and trying to access public route
    const locale = pathname.split('/')[1];
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
