'use client';

import { useState, useEffect } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ParentAuthGuardProps {
  children: React.ReactNode;
}

export default function ParentAuthGuard({ children }: ParentAuthGuardProps) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [passcode, setPasscode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Check if parent is already verified in this session
    const verified = sessionStorage.getItem('parent_verified');
    const timestamp = sessionStorage.getItem('parent_verified_at');

    if (verified === 'true' && timestamp) {
      // Check if verification is still valid (30 minutes)
      const verifiedAt = parseInt(timestamp);
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;

      if (now - verifiedAt < thirtyMinutes) {
        setIsVerified(true);
        setChecking(false);
        return;
      }
    }

    // Check if passcode is set
    checkPasscodeStatus();
  }, []);

  const checkPasscodeStatus = async () => {
    try {
      const response = await fetch('/api/auth/parent-passcode');
      const data = await response.json();

      if (response.ok) {
        setNeedsSetup(!data.hasPasscode);
      }
    } catch (error) {
      console.error('Failed to check passcode status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handlePasscodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`passcode-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (index === 3 && value) {
      const fullPasscode = newPasscode.join('');
      if (fullPasscode.length === 4) {
        if (needsSetup) {
          handleSetupPasscode(fullPasscode);
        } else {
          handleVerify(fullPasscode);
        }
      }
    }
  };

  const handlePasscodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      const prevInput = document.getElementById(`passcode-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSetupPasscode = async (fullPasscode: string) => {
    setError(null);

    try {
      setLoading(true);

      const response = await fetch('/api/auth/parent-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: fullPasscode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set passcode');
      }

      // After setting, verify immediately
      sessionStorage.setItem('parent_verified', 'true');
      sessionStorage.setItem('parent_verified_at', Date.now().toString());
      setIsVerified(true);
    } catch (err: any) {
      setError(err.message || 'Failed to set passcode');
      setPasscode(['', '', '', '']);
      document.getElementById('passcode-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (fullPasscode: string) => {
    setError(null);

    try {
      setLoading(true);

      const response = await fetch('/api/auth/verify-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: fullPasscode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsSetup) {
          setNeedsSetup(true);
          setError('Please set up your passcode first');
        } else {
          throw new Error(data.error || 'Verification failed');
        }
        return;
      }

      // Store verification in session
      sessionStorage.setItem('parent_verified', 'true');
      sessionStorage.setItem('parent_verified_at', Date.now().toString());

      setIsVerified(true);
    } catch (err: any) {
      setError(err.message || 'Invalid passcode');
      setPasscode(['', '', '', '']);
      document.getElementById('passcode-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChildLogin = () => {
    router.push('/en-US/child-login');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black text-text-main dark:text-white mb-2">
                {needsSetup ? 'Set Up Your Passcode' : 'Parent Verification'}
              </h1>
              <p className="text-sm text-text-muted dark:text-gray-400">
                {needsSetup
                  ? 'Create a 4-digit passcode to access the parent dashboard'
                  : 'Enter your 4-digit passcode to continue'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Passcode Input */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  id={`passcode-${index}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={passcode[index]}
                  onChange={(e) => handlePasscodeChange(index, e.target.value)}
                  onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                  disabled={loading}
                  className="w-14 h-14 md:w-16 md:h-16 text-center text-2xl font-bold bg-gray-100 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {loading && (
              <div className="text-center mb-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-3 text-text-muted dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            {/* Child Login Link */}
            <button
              type="button"
              onClick={handleChildLogin}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold transition-all disabled:opacity-50"
            >
              I&apos;m a Child - Go to Child Login
            </button>

            {/* Info */}
            <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                💡 {needsSetup
                  ? 'Your passcode is separate from your login password and is used for quick dashboard access.'
                  : 'This verification ensures that only parents can access the dashboard. Your passcode is valid for 30 minutes.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
