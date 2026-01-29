'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Plus, X, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { AppIcon } from '@/components/ui/AppIcon';
import { useLocale, useTranslations } from 'next-intl';

type AgeGroup = '5-7' | '8-11' | '12-14';

interface ChildForm {
  id: string;
  name: string;
  birthdate: string;
  age: number | null;
  ageGroup: AgeGroup;
}

function calculateAge(birthdate: string): number | null {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getAgeGroupFromAge(age: number | null): AgeGroup {
  if (!age) return '8-11';
  if (age <= 7) return '5-7';
  if (age <= 11) return '8-11';
  return '12-14';
}

export default function AddChildPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('onboarding.addChild');
  const tCommon = useTranslations('common');
  const [children, setChildren] = useState<ChildForm[]>([
    { id: '1', name: '', birthdate: '', age: null, ageGroup: '8-11' }
  ]);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Guard: Check if user already has children
  useEffect(() => {
    const checkExistingChildren = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('family_id')
          .eq('id', user.id)
          .single() as { data: { family_id: string } | null };

        if (userProfile?.family_id) {
          const { count } = await supabase
            .from('children')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', userProfile.family_id as string);

          if (count && count > 0) {
            router.replace(`/${locale}/dashboard`);
          }
        }
      }
    };

    checkExistingChildren();
  }, [router, locale]);

  const handleNameChange = (id: string, name: string) => {
    setChildren(children.map(child =>
      child.id === id ? { ...child, name } : child
    ));
  };

  const handleBirthdateChange = (id: string, birthdate: string) => {
    const age = calculateAge(birthdate);
    const ageGroup = getAgeGroupFromAge(age);
    setChildren(children.map(child =>
      child.id === id ? { ...child, birthdate, age, ageGroup } : child
    ));
  };

  const handleAddAnother = () => {
    const newId = (children.length + 1).toString();
    setChildren([...children, { id: newId, name: '', birthdate: '', age: null, ageGroup: '8-11' }]);
  };

  const handleRemove = (id: string) => {
    if (children.length === 1) {
      toast.error(t('mustHaveOneChild'));
      return;
    }
    setChildren(children.filter(child => child.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    // Validate all children
    const invalidChildren = children.filter(child => !child.name.trim() || !child.birthdate);
    if (invalidChildren.length > 0) {
      toast.error(t('fillAllFields'));
      return;
    }

    try {
      setLoading(true);

      const savedChildren: Array<{ id: string; ageGroup: string }> = [];

      // Save all children
      for (const child of children) {
        const response = await fetch('/api/onboarding/child', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: child.name.trim(),
            birthdate: child.birthdate,
            ageGroup: child.ageGroup,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save child');
        }

        const result = await response.json();
        savedChildren.push({
          id: result.child.id,
          ageGroup: result.child.age_group,
        });
      }

      // Store ALL children info in sessionStorage for next step
      if (savedChildren.length > 0) {
        sessionStorage.setItem('onboarding_children', JSON.stringify(savedChildren));
        // Keep first child info for backwards compatibility
        sessionStorage.setItem('onboarding_child_id', savedChildren[0].id);
        sessionStorage.setItem('onboarding_child_age_group', savedChildren[0].ageGroup);
        sessionStorage.setItem('onboarding_children_count', children.length.toString());
      }

      const firstChildId = savedChildren[0]?.id;

      toast.success(t('childrenAdded', { count: children.length }));

      // Navigate to next step
      router.push(`/${locale}/onboarding/select-style?childId=${firstChildId}`);
    } catch (error: unknown) {
      console.error('Failed to add children:', error);
      toast.error(t('addFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getAgeGroupLabel = (ageGroup: AgeGroup) => {
    const labels = {
      '5-7': { emoji: '🐣', label: t('ageGroups.mini') },
      '8-11': { emoji: '🚀', label: t('ageGroups.pro') },
      '12-14': { emoji: '🎓', label: t('ageGroups.teen') },
    };
    return labels[ageGroup];
  };

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6">
      {/* Main Card */}
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 md:p-12 motion-safe:animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <AppIcon name="face" size={32} weight="duotone" className="text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-text-main dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">
            {t('title')}
          </h1>
          <p className="text-text-muted dark:text-text-muted text-base">
            {t('subtitle')}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Children List */}
          {children.map((child, index) => (
            <div
              key={child.id}
              className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 relative"
            >
              {/* Remove Button (only show if more than 1 child) */}
              {children.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(child.id)}
                  aria-label={t('removeChild')}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
              )}

              {/* Child Number Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
                  <AppIcon name="face" size={16} weight="duotone" aria-hidden="true" />
                  {t('childNumber', { number: index + 1 })}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div>
                    <label
                      className="block text-sm font-bold text-text-main dark:text-white mb-2"
                      htmlFor={`child-name-${child.id}`}
                    >
                      {t('nameLabel')}
                    </label>
                    <input
                      autoFocus={index === 0}
                      id={`child-name-${child.id}`}
                      placeholder={t('namePlaceholder')}
                      type="text"
                      value={child.name}
                      onChange={(e) => handleNameChange(child.id, e.target.value)}
                      className={`w-full h-12 px-4 bg-white dark:bg-gray-900 border rounded-lg text-base focus:ring-1 outline-none transition-all placeholder:text-gray-400 dark:text-white ${hasSubmitted && !child.name.trim()
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary'
                        }`}
                    />
                    {hasSubmitted && !child.name.trim() && (
                      <p className="mt-1 text-xs text-red-500 font-medium" role="alert">
                        {t('nameRequired')}
                      </p>
                    )}
                  </div>

                  {/* Birthdate Input */}
                  <div>
                    <label
                      className="block text-sm font-bold text-text-main dark:text-white mb-2"
                      htmlFor={`child-birthdate-${child.id}`}
                    >
                      {t('birthdateLabel')}
                    </label>
                    <input
                      id={`child-birthdate-${child.id}`}
                      type="date"
                      value={child.birthdate}
                      onChange={(e) => handleBirthdateChange(child.id, e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full h-12 px-4 bg-white dark:bg-gray-900 border rounded-lg text-base focus:ring-1 outline-none transition-all dark:text-white ${hasSubmitted && !child.birthdate
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary'
                        }`}
                    />
                    {hasSubmitted && !child.birthdate && (
                      <p className="mt-1 text-xs text-red-500 font-medium" role="alert">
                        {t('birthdateRequired')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Auto-calculated Age & Age Group */}
              {child.age !== null && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {t('calculatedInfo')}
                      </p>
                      <p className="text-lg font-bold text-text-main dark:text-white">
                        {t('yearsOld', { age: child.age })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                        <span className="text-2xl" aria-hidden="true">{getAgeGroupLabel(child.ageGroup).emoji}</span>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {t('ageGroupLabel')}
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {getAgeGroupLabel(child.ageGroup).label}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Another Child Button */}
          <button
            type="button"
            onClick={handleAddAnother}
            className="w-full flex items-center justify-center gap-2 h-12 px-6 bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 text-text-muted dark:text-gray-400 hover:text-primary text-sm font-bold rounded-lg transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
            {t('addAnother')}
          </button>

          {/* Divider */}
          <div className="my-8 h-px w-full bg-gray-200 dark:bg-gray-800" />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full flex items-center justify-center gap-2 h-12 px-6 bg-primary hover:bg-primary/90 text-black text-base font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {loading && <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />}
            {loading ? tCommon('status.saving') : t('saveAndContinue', { count: children.length })}
          </button>
        </form>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 text-sm text-text-muted mt-6">
          <a className="hover:underline hover:text-primary" href="#">
            {tCommon('form.privacyPolicy')}
          </a>
          <span>•</span>
          <a className="hover:underline hover:text-primary" href="#">
            {tCommon('form.termsOfService')}
          </a>
        </div>
      </div>
    </div>
  );
}
