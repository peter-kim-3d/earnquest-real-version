'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/lib/utils/error';

interface InvitationData {
  id: string;
  email: string;
  familyName: string;
  invitedBy: string;
  expiresAt: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en-US';
  const t = useTranslations('auth.invite');
  const [token, setToken] = useState<string>('');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    // Check authentication status
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });

    // Fetch invitation details
    fetch(`/api/family/invite/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          // Check expiration client-side as well for safety
          if (new Date(data.invitation.expiresAt) < new Date()) {
            setError(t('expired'));
          } else {
            setInvitation(data.invitation);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch invitation:', err);
        setError(t('loadFailed'));
        setLoading(false);
      });
  }, [token, t]);

  const handleAccept = async () => {
    if (!token) return;

    try {
      setAccepting(true);

      const response = await fetch(`/api/family/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      toast.success(t('toast.welcomeToFamily'));
      router.refresh(); // Clear cache before navigation
      router.push(`/${locale}/dashboard`);
    } catch (error: unknown) {
      console.error('Accept error:', error);
      toast.error(getErrorMessage(error) || t('toast.acceptFailed'));
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <Loader2 className="h-12 w-12 motion-safe:animate-spin text-primary mx-auto mb-4" aria-hidden="true" />
          <p className="text-text-muted dark:text-text-muted">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-card-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">
              {t('invalidTitle')}
            </h1>
            <p className="text-text-muted dark:text-text-muted mb-6">
              {error}
            </p>
            <Link
              href={`/${locale}`}
              className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg transition-colors"
            >
              {t('goHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-card-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-white" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white mb-2">
              {t('youreInvited')}
            </h1>
            <p className="text-text-muted dark:text-text-muted mb-4">
              {t('invitedBy', { name: invitation.invitedBy })}
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted dark:text-text-muted">{t('familyName')}</span>
                <span className="font-semibold text-text-main dark:text-white">
                  {invitation.familyName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted dark:text-text-muted">{t('expires')}</span>
                <div className="text-right">
                  <span className="font-semibold text-text-main dark:text-white block">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-text-muted block">
                    {(() => {
                      const daysLeft = Math.ceil((new Date(invitation.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      if (daysLeft < 0) return t('expiresExpired');
                      if (daysLeft === 0) return t('expiresToday');
                      if (daysLeft === 1) return t('expiresTomorrow');
                      return t('daysLeft', { count: daysLeft });
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              aria-busy={accepting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />
                  {t('accepting')}
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" aria-hidden="true" />
                  {t('acceptInvitation')}
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-muted dark:text-text-muted text-center mb-3">
                {t('signInPrompt')}
              </p>
              <Link
                href={`/${locale}/login?invite=${token}`}
                className="w-full flex items-center justify-center px-6 py-4 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg transition-colors shadow-lg"
              >
                {t('signIn')}
              </Link>
              <Link
                href={`/${locale}/signup?invite=${token}`}
                className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-text-main dark:text-white font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('createAccount')}
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted dark:text-text-muted mt-6">
          {t('questions')}{' '}
          <Link href={`/${locale}`} className="text-primary hover:underline font-semibold">
            {t('visitHomepage')}
          </Link>
        </p>
      </div>
    </div>
  );
}
