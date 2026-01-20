'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowLeft, Loader2, HelpCircle, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import AvatarDisplay from '@/components/profile/AvatarDisplay';
import { AppIcon } from '@/components/ui/AppIcon';

interface Child {
  id: string;
  name: string;
  age_group: string;
  avatar_url: string | null;
}

type Step = 'code' | 'selection' | 'pin' | 'logging';

export default function ChildLoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en-US';
  const searchParams = useSearchParams();
  const t = useTranslations('auth.childLogin');

  // State management
  const [step, setStep] = useState<Step>('code');
  const [familyCode, setFamilyCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [requireChildPin, setRequireChildPin] = useState(true);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  // Check for family code in URL
  useEffect(() => {
    const urlCode = searchParams.get('familyCode');
    if (urlCode) {
      setFamilyCode(urlCode);
      validateCode(urlCode);
    }
    // Always start at code entry step - no fallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Validate family code
  const validateCode = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      // Run both requests in parallel to avoid waterfall
      const [validateRes, childrenRes] = await Promise.all([
        fetch('/api/family/validate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }),
        fetch('/api/children/by-family-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyCode: code }),
        }),
      ]);

      // Check validation result first
      if (!validateRes.ok) {
        const data = await validateRes.json();
        if (data.error === 'INVALID_CODE') {
          setError(t('errors.invalidCode'));
        } else {
          setError(t('errors.invalidFormat'));
        }
        setLoading(false);
        return;
      }

      // Check children fetch result
      if (!childrenRes.ok) {
        setError(t('errors.loadFailed'));
        setLoading(false);
        return;
      }

      const { familyName, children, requireChildPin: pinRequired } = await childrenRes.json();
      setFamilyName(familyName);
      setChildren(children);
      setRequireChildPin(pinRequired ?? true);
      setStep('selection');
    } catch (err) {
      console.error('Validation error:', err);
      setError(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
    setEnteredPin('');
    setError('');

    if (requireChildPin) {
      // PIN is required, show PIN entry step
      setStep('pin');
    } else {
      // PIN not required, login directly
      attemptLoginForChild(child, '');
    }
  };

  const attemptLoginForChild = async (child: Child, pin: string) => {
    setStep('logging');

    try {
      const response = await fetch('/api/auth/child-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: child.id,
          pinCode: pin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      // Success! Redirect to child dashboard
      toast.success(t('welcomeBack', { name: child.name }));
      router.push(`/${locale}/child/dashboard`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('errors.loginFailed');
      console.error('Login failed:', err);
      setStep('selection');
      setError(errorMessage);
      setTimeout(() => setError(''), 2000);
    }
  };

  const attemptLogin = async (pin: string) => {
    if (!selectedChild) return;
    setStep('logging');

    try {
      const response = await fetch('/api/auth/child-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChild.id,
          pinCode: pin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('errors.loginFailed'));
      }

      // Success! Redirect to child dashboard
      toast.success(t('welcomeBack', { name: selectedChild.name }));
      router.push(`/${locale}/child/dashboard`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('errors.incorrectPin');
      console.error('Login failed:', err);
      // Stay on PIN step and show error
      setStep('pin');
      setEnteredPin('');
      setError(errorMessage);
      // Auto-clear error after 2s
      setTimeout(() => setError(''), 2000);
    }
  };

  const handlePinType = (num: string) => {
    if (enteredPin.length < 4) {
      const newPin = enteredPin + num;
      setEnteredPin(newPin);
      if (newPin.length === 4) {
        // Auto-submit
        attemptLogin(newPin);
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (familyCode.length === 6) {
      validateCode(familyCode);
    }
  };

  const handleBack = () => {
    if (step === 'selection' && familyName) {
      // Go back to code entry if we came from code validation
      setStep('code');
      setError('');
    } else if (step === 'pin') {
      setStep('selection');
      setEnteredPin('');
      setError('');
    } else {
      router.push(`/${locale}`);
    }
  };

  const getAgeGroupEmoji = (ageGroup: string) => {
    const emojis: Record<string, string> = {
      '5-7': '🐣',
      '8-11': '🚀',
      '12-14': '🎓',
    };
    return emojis[ageGroup] || '🌟';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBack}
          disabled={step === 'logging'}
          className="mb-6 flex items-center gap-2 text-text-muted dark:text-text-muted hover:text-primary transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-5 w-5" />
          {t('back')}
        </button>

        {/* Main Card */}
        <div className="bg-white dark:bg-card-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          {/* Step 1: Family Code Entry */}
          {step === 'code' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">
                  {t('welcome')}
                </h1>
                <p className="text-text-muted dark:text-text-muted">
                  {t('enterFamilyCode')}
                </p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-text-main dark:text-white">
                      {t('familyCode')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInfoPopup(true)}
                      className="text-text-muted hover:text-primary transition-colors"
                      aria-label="How to get family code"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={familyCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 6) {
                        setFamilyCode(value);
                        setError('');
                      }
                    }}
                    placeholder="ABC123"
                    maxLength={6}
                    className={`w-full text-center text-3xl tracking-widest uppercase font-mono px-4 py-4 rounded-xl border-2 bg-white dark:bg-gray-800 text-text-main dark:text-white focus:outline-none focus:ring-2 transition-all ${error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200 animate-shake'
                      : 'border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/20'
                      }`}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                        {t('errors.connectionIssue')}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={familyCode.length !== 6 || loading}
                  className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('checking')}
                    </>
                  ) : (
                    t('continue')
                  )}
                </button>

                <p className="text-sm text-center text-text-muted dark:text-text-muted">
                  {t('askParent')}
                </p>
              </form>
            </>
          )}

          {/* Step 2: Child Selection */}
          {step === 'selection' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">
                  {t('whoAreYou')}
                </h1>
                <p className="text-text-muted dark:text-text-muted">
                  {familyName ? t('familyName', { name: familyName }) : t('selectProfile')}
                </p>
              </div>

              <div className="space-y-3">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleChildSelect(child)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                      {getAgeGroupEmoji(child.age_group)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-lg text-text-main dark:text-white group-hover:text-primary">
                        {child.name}
                      </p>
                      <p className="text-sm text-text-muted dark:text-text-muted">
                        {t('age', { ageGroup: child.age_group })}
                      </p>
                    </div>
                    <AppIcon name="arrow_forward" size={20} className="text-gray-400 group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 3: PIN Entry */}
          {step === 'pin' && selectedChild && (
            <div className="w-full max-w-sm mx-auto">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex justify-center">
                  <AvatarDisplay
                    avatarUrl={selectedChild.avatar_url}
                    userName={selectedChild.name}
                    size="lg"
                  />
                </div>
                <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">
                  {t('hello', { name: selectedChild.name })}
                </h1>
                <p className="text-text-muted dark:text-text-muted">
                  {t('enterSecretCode')}
                </p>
              </div>

              {/* PIN Dots */}
              <div className="flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all ${enteredPin.length > i
                      ? 'bg-primary scale-110'
                      : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 text-center animate-shake">
                  <p className="text-red-500 text-sm font-semibold bg-red-50 dark:bg-red-900/20 py-1 px-3 rounded-full inline-block">
                    {error}
                  </p>
                </div>
              )}

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinType(num.toString())}
                    className="h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 text-2xl font-bold text-text-main dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    {num}
                  </button>
                ))}
                <div /> {/* Spacer */}
                <button
                  onClick={() => handlePinType('0')}
                  className="h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 text-2xl font-bold text-text-main dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  0
                </button>
                <button
                  onClick={handlePinBackspace}
                  className="h-16 rounded-2xl flex items-center justify-center text-text-muted hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
                >
                  <ArrowLeft className="h-8 w-8" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Logging In */}
          {step === 'logging' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-text-muted dark:text-text-muted">{t('loggingIn')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted dark:text-text-muted mt-6">
          {t('areYouParent')}{' '}
          <Link href={`/${locale}/login`} className="text-primary hover:underline font-semibold">
            {t('parentLogin')}
          </Link>
        </p>
      </div>

      {/* Info Popup */}
      {showInfoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-dark rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowInfoPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-text-main dark:text-white">
                {t('infoPopup.title')}
              </h3>
            </div>

            <div className="space-y-3 text-sm text-text-muted dark:text-gray-300">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <p>{t('infoPopup.step1')}</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <p>{t('infoPopup.step2')}</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <p>{t('infoPopup.step3')}</p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoPopup(false)}
              className="w-full mt-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors"
            >
              {t('infoPopup.gotIt')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
