import { createClient } from '@/lib/supabase/client';

function getRedirectUrl() {
  // Use window.location.origin for client-side, fallback to env var for SSR
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL;
  return `${origin}/en-US/callback`;
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const redirectTo = getRedirectUrl();
  console.log('OAuth redirectTo:', redirectTo); // Debug log
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInWithApple() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: getRedirectUrl(),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Check for specific error cases
    if (error.message.includes('Email not confirmed') ||
        error.message.includes('email_not_confirmed')) {
      throw new Error('Please verify your email address before logging in. Check your inbox for the confirmation link.');
    }

    // Check for invalid credentials
    if (error.message.includes('Invalid login credentials') ||
        error.message.includes('invalid_credentials')) {
      throw new Error('Invalid email or password. If you just signed up, please check your email to verify your account first.');
    }

    // Generic error
    throw new Error(error.message);
  }

  return data;
}

export async function signUp(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl(),
    },
  });

  if (error) {
    // Check for user already exists
    if (error.message.includes('already registered') ||
        error.message.includes('User already registered')) {
      throw new Error('This email is already registered. Please log in instead.');
    }

    throw new Error(error.message);
  }

  // Create user profile in users table
  if (data.user) {
    // This will be handled by a database trigger or webhook
    // For now, we'll redirect to onboarding
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user;
}
