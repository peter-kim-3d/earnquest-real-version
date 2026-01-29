import { createClient } from '@/lib/supabase/server';
import { getOrCreateUserProfile } from '@/lib/services/user';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // Check for pending invite token in cookies
  const cookieStore = await cookies();
  const pendingInvite = cookieStore.get('pending_invite')?.value;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${requestUrl.origin}/${locale}/login?error=auth_failed`);
    }

    // Create family and user profile if they don't exist
    if (data.user) {
      try {
        const userProfile = await getOrCreateUserProfile(data.user) as { family_id: string } | null;

        // If there's a pending invite, redirect back to the invite page
        if (pendingInvite) {
          // Clear the cookie
          const response = NextResponse.redirect(`${requestUrl.origin}/${locale}/invite/${pendingInvite}`);
          response.cookies.delete('pending_invite');
          return response;
        }

        // Check if user already has children
        if (userProfile && userProfile.family_id) {
          const { count } = await supabase
            .from('children')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', userProfile.family_id);

          if (count && count > 0) {
            return NextResponse.redirect(`${requestUrl.origin}/${locale}/dashboard`);
          }
        }
      } catch (err: unknown) {
        console.error('Error checking user profile:', err);
        // Continue to onboarding if check fails
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/${locale}/onboarding/add-child`);
}
