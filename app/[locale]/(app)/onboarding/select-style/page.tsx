'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import PresetSelector, { type PresetKey } from '@/components/onboarding/PresetSelector';
import { toast } from 'sonner';

export default function SelectStylePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get('childId');
  const [selectedStyle, setSelectedStyle] = useState<PresetKey>('balanced');
  const [hasPet, setHasPet] = useState(false);
  const [hasInstrument, setHasInstrument] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    try {
      setLoading(true);

      // Get first child info for age group (tasks are global, so we just need one reference)
      const childrenJson = sessionStorage.getItem('onboarding_children');
      let firstChild: { id: string; ageGroup: string } | null = null;

      if (childrenJson) {
        const children = JSON.parse(childrenJson);
        firstChild = children[0] || null;
      } else if (childId) {
        // Fallback to single child for backwards compatibility
        const ageGroup = sessionStorage.getItem('onboarding_child_age_group') || '8-11';
        firstChild = { id: childId, ageGroup };
      }

      if (!firstChild) {
        toast.error('Child required', {
          description: 'Please add a child first',
        });
        router.push('/en-US/onboarding/add-child');
        return;
      }

      // Populate tasks and rewards ONCE for the family (tasks are global)
      const response = await fetch('/api/onboarding/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: selectedStyle,
          childId: firstChild.id, // Used for age group reference only
          ageGroup: firstChild.ageGroup,
          conditionalAnswers: {
            hasPet,
            hasInstrument,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to populate tasks and rewards');
      }

      const result = await response.json();
      console.log('Populated tasks and rewards:', result);

      // Store selected style
      sessionStorage.setItem('onboarding_style', selectedStyle);

      // Navigate to next step
      const firstChildId = firstChild.id;
      router.push(`/en-US/onboarding/family-values?childId=${firstChildId}&style=${selectedStyle}`);
    } catch (error) {
      console.error('Failed to save style:', error);
      toast.error('Save failed', {
        description: 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl flex flex-col">
      {/* Progress Bar Section */}
      <div className="flex flex-col gap-3 p-4 mb-4">
        <div className="flex gap-6 justify-between">
          <p className="text-text-main dark:text-white text-base font-medium leading-normal">
            Step 2 of 4
          </p>
        </div>
        <div className="rounded bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded bg-primary shadow-[0_0_10px_rgba(55,236,19,0.5)]"
            style={{ width: '50%' }}
          />
        </div>
        <p className="text-text-muted dark:text-text-muted text-sm font-normal leading-normal">
          Style Selection
        </p>
      </div>

      {/* Page Heading */}
      <div className="flex flex-wrap justify-between gap-3 px-4 pb-4">
        <div className="flex min-w-72 flex-col gap-3">
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            Choose Your Family Style
          </h1>
          <p className="text-text-muted dark:text-text-muted text-base font-normal leading-normal max-w-2xl">
            Don&apos;t worry, you can always customize this later. Pick a starting
            point that fits your goals right now.
          </p>
        </div>
      </div>

      {/* v2: Preset Selector */}
      <div className="px-4 py-3">
        <PresetSelector selectedPreset={selectedStyle} onSelectPreset={setSelectedStyle} />
      </div>

      {/* v2: Conditional Questions */}
      <div className="px-4 py-6">
        <div className="max-w-2xl">
          <h3 className="text-text-main dark:text-white text-lg font-bold mb-4">
            A few quick questions to customize your tasks:
          </h3>
          <div className="space-y-4">
            {/* Has Pet Question */}
            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-card-dark cursor-pointer hover:border-primary transition-colors">
              <input
                type="checkbox"
                checked={hasPet}
                onChange={(e) => setHasPet(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <p className="text-text-main dark:text-white font-semibold">
                  Do you have a pet? 🐶
                </p>
                <p className="text-text-muted dark:text-text-muted text-sm">
                  We&apos;ll add a &quot;Feed the pet&quot; task
                </p>
              </div>
            </label>

            {/* Has Instrument Question */}
            {(selectedStyle === 'academic' || selectedStyle === 'balanced') && (
              <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-card-dark cursor-pointer hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  checked={hasInstrument}
                  onChange={(e) => setHasInstrument(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="text-text-main dark:text-white font-semibold">
                    Does your child play an instrument? 🎹
                  </p>
                  <p className="text-text-muted dark:text-text-muted text-sm">
                    We&apos;ll add a &quot;Practice instrument&quot; task
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Meta / Help Text */}
      <div className="px-4 py-2">
        <button className="w-full text-center group">
          <p className="text-text-muted dark:text-text-muted text-sm font-normal leading-normal underline decoration-dashed underline-offset-4 group-hover:text-primary transition-colors flex items-center justify-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Not sure which to pick? Help me choose
          </p>
        </button>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 px-4 py-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-text-muted dark:text-text-muted font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={loading}
          className="flex items-center gap-2 px-10 py-4 rounded-full bg-primary hover:bg-primary/90 text-black font-bold text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Next: Set Values'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
