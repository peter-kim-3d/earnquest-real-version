import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Redirect to login page
  return NextResponse.redirect(new URL('/en-US/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'));
}

export async function GET() {
  // Also support GET for convenience
  return POST();
}
