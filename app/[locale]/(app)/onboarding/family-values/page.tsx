'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Plus, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { AppIcon } from '@/components/ui/AppIcon';
import { useLocale, useTranslations } from 'next-intl';

type FamilyValue = {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  checked: boolean;
};



export default function FamilyValuesPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations('onboarding.familyValues');
  const tProgress = useTranslations('onboarding.progress');
  const tCommon = useTranslations('common');
  const childId = searchParams.get('childId');
  const style = searchParams.get('style');

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<FamilyValue[]>([
    {
      id: 'gratitude',
      icon: 'handshake',
      titleKey: 'items.gratitude.title',
      descriptionKey: 'items.gratitude.description',
      checked: true,
    },
    {
      id: 'greetings',
      icon: 'wb_sunny',
      titleKey: 'items.greetings.title',
      descriptionKey: 'items.greetings.description',
      checked: true,
    },
    {
      id: 'honesty',
      icon: 'verified',
      titleKey: 'items.honesty.title',
      descriptionKey: 'items.honesty.description',
      checked: false,
    },
    {
      id: 'respect',
      icon: 'record_voice_over',
      titleKey: 'items.respect.title',
      descriptionKey: 'items.respect.description',
      checked: false,
    },
    {
      id: 'clean_spaces',
      icon: 'cleaning_services',
      titleKey: 'items.cleanSpaces.title',
      descriptionKey: 'items.cleanSpaces.description',
      checked: true,
    },
  ]);

  const toggleValue = (id: string) => {
    setValues(
      values.map((value) =>
        value.id === id ? { ...value, checked: !value.checked } : value
      )
    );
  };

  const handleSkip = () => {
    router.push(`/${locale}/onboarding/complete`);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Get selected values with translated titles and descriptions
      const selectedValues = values
        .filter((v) => v.checked)
        .map((v) => ({
          value_id: v.id,
          title: t(v.titleKey),
          description: t(v.descriptionKey),
          icon: v.icon,
        }));

      // Save to database
      const response = await fetch('/api/onboarding/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: selectedValues,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save family values');
      }

      const result = await response.json();
      console.log('Saved values:', result);

      // Navigate to next step
      router.push(`/${locale}/onboarding/complete`);
    } catch (error: unknown) {
      console.error('Failed to save values:', error);
      toast.error(t('saveFailed'), {
        description: tCommon('errors.generic'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-5xl flex-col gap-10">
      {/* ProgressBar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">
            {tProgress('step', { current: 3, total: 4 })}
          </p>
          <p className="text-sm font-medium text-text-main dark:text-white">
            {t('stepTitle')}
          </p>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100} aria-label={tProgress('step', { current: 3, total: 4 })}>
          <div className="h-2 w-3/4 rounded-full bg-primary shadow-[0_0_10px_rgba(55,236,19,0.5)]" />
        </div>
      </div>

      {/* PageHeading */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl text-text-main dark:text-white">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-lg font-normal leading-relaxed text-text-muted dark:text-text-muted">
          {t('subtitle')}
        </p>

        {/* Psychology Pro Tip */}
        <div className="mt-2 flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800/30">
          <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
              {t('whyNoPoints')}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('whyNoPointsDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {values.map((value) => (
          <label
            key={value.id}
            className="group relative flex cursor-pointer flex-col gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-card-dark p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:checked]:bg-primary/5 dark:has-[:checked]:bg-primary/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-full bg-background-light dark:bg-background-dark text-text-main dark:text-white" aria-hidden="true">
                <AppIcon name={value.icon} size={24} weight="duotone" />
              </div>
              {/* Toggle Switch */}
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={value.checked}
                  onChange={() => toggleValue(value.id)}
                />
                <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 peer-checked:bg-primary transition-all" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all peer-checked:translate-x-full border border-gray-100" />
              </div>
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold text-text-main dark:text-white">
                {t(value.titleKey)}
              </h3>
              <p className="text-sm text-text-muted dark:text-text-muted">
                {t(value.descriptionKey)}
              </p>
            </div>
          </label>
        ))}

        {/* Add Custom Value */}
        <button type="button" className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent p-6 text-text-muted dark:text-text-muted hover:border-primary hover:bg-primary/5 hover:text-primary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-background-light dark:bg-background-dark">
            <Plus className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="font-medium">{t('addCustomValue')}</span>
        </button>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-800 pt-8 sm:flex-row">
        <button
          type="button"
          onClick={handleSkip}
          className="w-full rounded-xl px-6 py-3 text-base font-bold text-text-muted dark:text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 sm:w-auto transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          {t('skipForNow')}
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading}
          aria-busy={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-10 py-3 text-base font-bold text-black shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? tCommon('status.saving') : t('completeSelection')}</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
