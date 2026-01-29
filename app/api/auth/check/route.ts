import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/check
 * Check if user is authenticated
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json({
      authenticated: !!user,
      user: user
        ? {
            id: user.id,
            email: user.email,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
