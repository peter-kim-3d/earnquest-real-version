'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import PresetSelector from '@/components/onboarding/PresetSelector';
import ModuleSelector from '@/components/onboarding/ModuleSelector';
import { PresetKey, ModuleKey } from '@/lib/types/task';
import { calculateDailyPoints } from '@/lib/utils/onboarding';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

export default function SelectStylePage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations('onboarding.selectStyle');
  const tProgress = useTranslations('onboarding.progress');
  const tCommon = useTranslations('common');
  const childId = searchParams.get('childId');
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('balanced');
  const [enabledModules, setEnabledModules] = useState<ModuleKey[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggleModule = (module: ModuleKey) => {
    setEnabledModules((prev) => (prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]));
  };

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
        toast.error(t('childRequired'), {
          description: t('childRequiredDescription'),
        });
        router.push(`/${locale}/onboarding/add-child`);
        return;
      }

      // v2.1: Populate tasks and rewards with preset + modules
      const response = await fetch('/api/onboarding/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetKey: selectedPreset,
          childId: firstChild.id, // Used for age group reference only
          ageGroup: firstChild.ageGroup,
          enabledModules,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to populate tasks and rewards');
      }

      const result = await response.json();
      console.log('Populated tasks and rewards:', result);

      // Store selected preset and modules
      sessionStorage.setItem('onboarding_preset', selectedPreset);
      sessionStorage.setItem('onboarding_modules', JSON.stringify(enabledModules));

      // Navigate to next step
      const firstChildId = firstChild.id;
      router.push(`/${locale}/onboarding/family-values?childId=${firstChildId}&preset=${selectedPreset}`);
    } catch (error) {
      console.error('Failed to save style:', error);
      toast.error(t('saveFailed'), {
        description: tCommon('errors.generic'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total daily points for display
  const totalDailyPoints = calculateDailyPoints(selectedPreset, enabledModules);

  return (
    <div className="w-full max-w-5xl flex flex-col">
      {/* Progress Bar Section */}
      <div className="flex flex-col gap-3 p-4 mb-4">
        <div className="flex gap-6 justify-between">
          <p className="text-text-main dark:text-white text-base font-medium leading-normal">{tProgress('step', { current: 2, total: 4 })}</p>
        </div>
        <div className="rounded bg-gray-200 dark:bg-gray-700">
          <div className="h-2 rounded bg-primary shadow-[0_0_10px_rgba(55,236,19,0.5)]" style={{ width: '50%' }} />
        </div>
        <p className="text-text-muted dark:text-text-muted text-sm font-normal leading-normal">{t('stepTitle')}</p>
      </div>

      {/* Page Heading */}
      <div className="flex flex-wrap justify-between gap-3 px-4 pb-4">
        <div className="flex min-w-72 flex-col gap-3">
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            {t('title')}
          </h1>
          <p className="text-text-muted dark:text-text-muted text-base font-normal leading-normal max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="px-4 py-3">
        <PresetSelector selectedPreset={selectedPreset} onSelectPreset={setSelectedPreset} />
      </div>

      {/* Module Add-ons */}
      <div className="px-4 py-6">
        <div className="max-w-full">
          <h3 className="text-text-main dark:text-white text-lg font-bold mb-4">{t('optionalAddons')}</h3>
          <ModuleSelector enabledModules={enabledModules} onToggle={handleToggleModule} />
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-text-muted dark:text-text-muted font-medium">{t('totalDailyPoints')}</span>
            <span className="text-2xl font-black text-primary">{totalDailyPoints} {tCommon('points.xp')}</span>
          </div>
        </div>
      </div>

      {/* Meta / Help Text */}
      <div className="px-4 py-2">
        <button className="w-full text-center group">
          <p className="text-text-muted dark:text-text-muted text-sm font-normal leading-normal underline decoration-dashed underline-offset-4 group-hover:text-primary transition-colors flex items-center justify-center gap-2">
            <HelpCircle className="h-4 w-4" />
            {t('helpMeChoose')}
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
          {tCommon('buttons.back')}
        </button>
        <button
          onClick={handleNext}
          disabled={loading}
          className="flex items-center gap-2 px-10 py-4 rounded-full bg-primary hover:bg-primary/90 text-black font-bold text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? tCommon('status.saving') : t('nextSetValues')}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
