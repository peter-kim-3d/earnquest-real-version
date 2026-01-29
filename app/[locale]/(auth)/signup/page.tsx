'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { signInWithGoogle, signInWithApple, signUp } from '@/lib/services/auth';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en-US';
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const t = useTranslations('auth.signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const enableAppleLogin = process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN === 'true';

  useEffect(() => {
    // Store invite token in both sessionStorage and cookie if present
    // Cookie is needed for OAuth flow (server-side callback)
    if (inviteToken) {
      sessionStorage.setItem('pending_invite', inviteToken);
      // Set cookie that expires in 1 hour (enough time to complete OAuth)
      document.cookie = `pending_invite=${inviteToken}; path=/; max-age=3600; SameSite=Lax`;
    }
  }, [inviteToken]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : null;
      setError(message || t('errors.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithApple();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : null;
      setError(message || t('errors.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t('errors.emailRequired'));
      return;
    }

    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const result = await signUp(email, password);

      // Check if email confirmation is required
      if (result.user && !result.user.email_confirmed_at) {
        // Email confirmation required
        setSuccess(t('success.accountCreated'));
        setEmail('');
        setPassword('');
        return;
      }

      // Email confirmed or not required - proceed to onboarding
      const pendingInvite = sessionStorage.getItem('pending_invite');
      if (pendingInvite) {
        sessionStorage.removeItem('pending_invite');
        router.push(`/${locale}/invite/${pendingInvite}`);
      } else {
        router.push(`/${locale}/onboarding/add-child`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : null;
      setError(message || t('errors.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-main dark:text-white tracking-[-0.033em] mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {t('subtitle')}
        </p>
      </div>

      {/* Social Login Section */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          aria-busy={loading}
          className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-primary/20 hover:bg-gray-50 dark:hover:bg-primary/10 hover:border-gray-300 dark:hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-sm font-bold text-text-main dark:text-white">
            {t('continueWithGoogle')}
          </span>
        </button>

        {enableAppleLogin && (
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={loading}
            aria-busy={loading}
            className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-primary/20 hover:bg-gray-50 dark:hover:bg-primary/10 hover:border-gray-300 dark:hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-black dark:text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.11 4.37-1.14 1.05-.01 2.47.49 3.2 1.53-2.68 1.63-2.12 5.38.83 6.75-.48 2.37-2.05 4.35-3.48 5.09zm-3.66-15.3c.6-1.07 1.84-1.85 2.96-1.85.08 1.4-1.12 2.86-2.3 3.29-1.06.41-2.29-.32-2.73-1.44z" />
            </svg>
            <span className="text-sm font-bold text-text-main dark:text-white">
              {t('continueWithApple')}
            </span>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div aria-hidden="true" className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-primary/20" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background-light dark:bg-background-dark px-3 text-gray-500 font-medium">
            {t('orSignUpWithEmail')}
          </span>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" role="status" aria-live="polite">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" role="alert">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Email Form */}
      <form className="space-y-5" onSubmit={handleEmailSignup}>
        <div className="space-y-2">
          <label
            className="text-sm font-bold text-text-main dark:text-white ml-1"
            htmlFor="email"
          >
            {t('email')}
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-xl border-gray-200 bg-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-12 px-4 dark:bg-card-dark dark:border-primary/20 dark:text-white dark:focus:ring-primary/50"
              id="email"
              placeholder={t('emailPlaceholder')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 opacity-0 peer-valid:opacity-100 transition-opacity">
              <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-bold text-text-main dark:text-white ml-1"
            htmlFor="password"
          >
            {t('password')}
          </label>
          <div className="relative">
            <input
              className="block w-full rounded-xl border-gray-200 bg-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-12 px-4 dark:bg-card-dark dark:border-primary/20 dark:text-white dark:focus:ring-primary/50"
              id="password"
              placeholder={t('passwordPlaceholder')}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary h-12 px-8 text-sm font-bold text-black shadow-lg shadow-primary/25 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading && <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />}
            {loading ? t('submitting') : t('submit')}
            {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />}
          </button>
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            {t('agreeToTerms')}{' '}
            <Link
              href="/terms"
              className="font-bold underline decoration-gray-300 hover:decoration-primary underline-offset-2 hover:text-primary transition-colors"
            >
              {t('termsOfService')}
            </Link>{' '}
            {t('and')}{' '}
            <Link
              href="/privacy"
              className="font-bold underline decoration-gray-300 hover:decoration-primary underline-offset-2 hover:text-primary transition-colors"
            >
              {t('privacyPolicy')}
            </Link>
            .
          </p>
        </div>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-primary/10">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('hasAccount')}{' '}
          <Link
            href={`/${locale}/login`}
            className="font-bold text-text-main dark:text-primary hover:underline decoration-2 decoration-primary underline-offset-2 ml-1"
          >
            {t('logIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
