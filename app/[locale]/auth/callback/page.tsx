'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Exchange code for session
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Check if user has a family (for onboarding)
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Check if user record exists
          const { data: userRecord } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single();

          if (!userRecord || !userRecord.family_id) {
            // New user - redirect to onboarding
            router.push('/en-US/onboarding');
          } else {
            // Existing user - redirect to dashboard
            router.push('/en-US/dashboard');
          }
        } else {
          // No user, redirect to login
          router.push('/en-US/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => router.push('/en-US/login'), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">❌</div>
          <p className="text-gray-900 font-medium">{error}</p>
          <p className="text-sm text-gray-600 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-quest-purple mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}
