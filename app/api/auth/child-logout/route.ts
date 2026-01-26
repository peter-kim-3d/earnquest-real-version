import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en-US';

  // Delete child session cookie
  cookieStore.delete('child_session');

  // Return JSON response with redirect URL (client handles redirect)
  return NextResponse.json({
    success: true,
    redirectUrl: `/${locale}/child-login`,
  });
}

export async function GET() {
  // GET request redirects directly (for browser navigation)
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en-US';

  cookieStore.delete('child_session');

  return NextResponse.redirect(
    new URL(`/${locale}/child-login`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001')
  );
}
