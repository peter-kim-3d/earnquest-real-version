import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en-US';

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Return JSON response with redirect URL (client handles redirect)
  return NextResponse.json({
    success: true,
    redirectUrl: `/${locale}/login`,
  });
}

export async function GET() {
  // GET request redirects directly (for browser navigation)
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en-US';
  const supabase = await createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL(`/${locale}/login`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001')
  );
}
