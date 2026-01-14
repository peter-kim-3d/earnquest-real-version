import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();

  // Delete child session cookie
  cookieStore.delete('child_session');

  return NextResponse.redirect(new URL('/en-US/child-login', process.env.NEXT_PUBLIC_APP_URL));
}
