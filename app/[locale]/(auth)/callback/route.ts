import { createClient } from '@/lib/supabase/server';
import { getOrCreateUserProfile } from '@/lib/services/user';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${requestUrl.origin}/en-US/login?error=auth_failed`);
    }

    // Create family and user profile if they don't exist
    if (data.user) {
      try {
        const userProfile = await getOrCreateUserProfile(data.user) as { family_id: string } | null;

        // Check if user already has children
        if (userProfile && userProfile.family_id) {
          const { count } = await supabase
            .from('children')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', userProfile.family_id);

          if (count && count > 0) {
            return NextResponse.redirect(`${requestUrl.origin}/en-US/dashboard`);
          }
        }
      } catch (err) {
        console.error('Error checking user profile:', err);
        // Continue to onboarding if check fails
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/en-US/onboarding/add-child`);
}
