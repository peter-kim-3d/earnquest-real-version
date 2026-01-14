'use client';

import { useRouter } from 'next/navigation';
import { Rocket, CheckCircle2, User, ListChecks, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AppIcon } from '@/components/ui/AppIcon';

interface ChildInfo {
  name: string;
  age: number | null;
  birthdate: string | null;
}

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [totalChildren, setTotalChildren] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get child info from sessionStorage
    const childId = sessionStorage.getItem('onboarding_child_id');
    const childrenCount = sessionStorage.getItem('onboarding_children_count');

    if (childrenCount) {
      setTotalChildren(parseInt(childrenCount, 10));
    }

    if (childId) {
      // Fetch child data
      fetch(`/api/children/${childId}`)
        .then(res => res.json())
        .then(data => {
          if (data.child) {
            // Calculate age from birthdate if available
            let age = null;
            if (data.child.birthdate) {
              const today = new Date();
              const birth = new Date(data.child.birthdate);
              age = today.getFullYear() - birth.getFullYear();
              const monthDiff = today.getMonth() - birth.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
              }
            }

            setChildInfo({
              name: data.child.name,
              age,
              birthdate: data.child.birthdate,
            });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch child info:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleStartNow = () => {
    router.push('/en-US/dashboard');
  };

  const handleAdjustSettings = () => {
    router.push('/en-US/tasks');
  };

  return (
    <div className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--primary)) 2px, transparent 2px),
                             radial-gradient(hsl(var(--primary)) 2px, transparent 2px),
                             radial-gradient(hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0, 25px 25px, 10px 10px',
          }}
        />
      </div>
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl dark:bg-primary/5" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl dark:bg-blue-500/5" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Hero Illustration / Icon */}
        <div className="mb-8 inline-flex items-center justify-center p-6 bg-white dark:bg-card-dark rounded-full shadow-xl shadow-primary/10 border-4 border-primary/20 animate-bounce-slow">
          <AppIcon name="emoji_events" size={64} weight="duotone" className="text-primary" />
        </div>

        {/* Header Text */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-main dark:text-white">
          Ready! <span className="text-primary">🎉</span>
        </h1>
        <p className="text-lg md:text-xl text-text-muted dark:text-text-muted mb-10 max-w-lg mx-auto">
          You&apos;re all set up! {totalChildren > 1 ? 'Your children\'s' : 'Your child\'s'} first tasks are waiting. Let&apos;s start
          building those good habits together.
        </p>

        {/* Status Card Summary */}
        <div className="bg-white dark:bg-card-dark/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-10 text-left shadow-lg max-w-md mx-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-text-muted mb-4">
            Configuration Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-muted dark:text-text-muted">
                  Child Profile
                </p>
                <p className="font-semibold text-text-main dark:text-white">
                  {loading ? 'Loading...' : childInfo ? (
                    totalChildren > 1
                      ? `${childInfo.name} and ${totalChildren - 1} other${totalChildren > 2 ? 's' : ''}`
                      : `${childInfo.name}${childInfo.age ? ` (Age ${childInfo.age})` : ''}`
                  ) : 'Child Added'}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>

            <div className="w-full h-px bg-gray-100 dark:bg-gray-700" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <ListChecks className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-muted dark:text-text-muted">
                  Daily Tasks
                </p>
                <p className="font-semibold text-text-main dark:text-white">
                  3 Tasks Set
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>

            <div className="w-full h-px bg-gray-100 dark:bg-gray-700" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Star className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-muted dark:text-text-muted">
                  Weekly Goal
                </p>
                <p className="font-semibold text-text-main dark:text-white">
                  500 Points
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleStartNow}
            className="w-full md:w-auto px-8 py-4 bg-primary text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Rocket className="h-5 w-5" />
            Start Now
          </button>
          <button
            onClick={handleAdjustSettings}
            className="w-full md:w-auto px-8 py-4 bg-transparent border-2 border-gray-200 dark:border-gray-700 text-text-muted dark:text-text-muted font-semibold text-lg rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Adjust Tasks/Rewards
          </button>
        </div>

        {/* Reassurance Text */}
        <p className="mt-6 text-sm text-text-muted dark:text-text-muted">
          Don&apos;t worry, you can change these settings anytime from the settings
          menu.
        </p>
      </div>
    </div>
  );
}
