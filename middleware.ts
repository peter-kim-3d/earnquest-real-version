import { updateSession } from '@/lib/supabase/middleware';
import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/lib/i18n/config';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  // First, handle i18n routing
  const intlResponse = intlMiddleware(request);

  // Then update Supabase session using the i18n response
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - pamphlet, manual (static marketing pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|pamphlet|manual|ko/pamphlet|ko/manual|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
