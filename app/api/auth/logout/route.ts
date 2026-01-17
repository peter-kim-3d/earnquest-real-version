import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en-US';

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Redirect to login page
  return NextResponse.redirect(new URL(`/${locale}/login`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'));
}

export async function GET() {
  // Also support GET for convenience
  return POST();
}
