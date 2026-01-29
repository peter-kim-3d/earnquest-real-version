'use client';

import { CheckCircle2, Plus, Star } from 'lucide-react';
import { PresetKey } from '@/lib/types/task';
import { PRESETS, getPresetTaskTemplates } from '@/lib/config/presets';
import { useTranslations } from 'next-intl';

interface PresetSelectorProps {
  selectedPreset: PresetKey;
  onSelectPreset: (preset: PresetKey) => void;
}

export default function PresetSelector({ selectedPreset, onSelectPreset }: PresetSelectorProps) {
  const t = useTranslations('onboarding.selectStyle');
  const tCommon = useTranslations('common');
  const presetOrder: PresetKey[] = ['starter', 'balanced', 'learning_focus'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {presetOrder.map((key) => {
        const preset = PRESETS[key];
        const isSelected = selectedPreset === key;
        const isRecommended = preset.recommended;
        const templates = getPresetTaskTemplates(key);
        const totalPoints = templates.reduce((sum, t) => sum + t.points, 0);

        // Get examples from templates
        const examples = templates.slice(0, 4).map((t) => t.name);

        return (
          <label
            key={key}
            className={`group relative flex flex-col gap-4 rounded-xl border-2 border-solid bg-white dark:bg-card-dark p-6 cursor-pointer hover:shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
              isRecommended
                ? 'ring-4 ring-transparent hover:ring-primary/10 border-gray-200 dark:border-gray-800'
                : 'border-gray-200 dark:border-gray-800 hover:border-primary'
            }`}
          >
            <input
              className="peer sr-only"
              name="preset_selection"
              type="radio"
              value={key}
              checked={isSelected}
              onChange={() => onSelectPreset(key)}
              aria-label={`${preset.name}${isRecommended ? ` (${t('recommended')})` : ''}`}
            />

            {/* Active State Border */}
            <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary pointer-events-none" />

            {/* Active State Checkmark */}
            <div className="absolute -top-2.5 -right-2.5 bg-primary text-black rounded-full p-1 hidden peer-checked:block shadow-md z-10" aria-hidden="true">
              <CheckCircle2 className="h-4 w-4" />
            </div>

            <div className="flex flex-col gap-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight">{preset.name}</h2>
                {isRecommended && (
                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider rounded-full px-2 py-1 bg-primary text-black">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    {t('recommended')}
                  </span>
                )}
              </div>

              {/* Icon & Description */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl" aria-hidden="true">{preset.icon}</span>
                <div className="flex flex-col">
                  <span className="text-text-main dark:text-white text-xl font-black leading-tight tracking-[-0.02em]">
                    {t('tasks', { count: preset.taskKeys.length })}
                  </span>
                </div>
              </div>

              <span className="text-text-muted dark:text-text-muted text-sm font-medium leading-tight">
                {preset.tagline}
              </span>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

            {/* Examples */}
            <div className="flex flex-col gap-3 mt-auto">
              <p className="text-xs font-bold text-text-main dark:text-white uppercase tracking-wide opacity-60">
                {t('includes')}
              </p>
              {examples.slice(0, 3).map((example, index) => (
                <div
                  key={index}
                  className="text-sm font-normal leading-normal flex items-start gap-3 text-text-main dark:text-white"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{example}</span>
                </div>
              ))}
              {templates.length > 3 && (
                <div className="text-sm font-normal leading-normal flex items-start gap-3 text-text-main dark:text-white opacity-50">
                  <Plus className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{t('moreTasks', { count: templates.length - 3 })}</span>
                </div>
              )}
            </div>

            {/* Daily Points Range */}
            <div className="mt-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <p className="text-xs text-text-muted dark:text-text-muted text-center">{tCommon('points.perDay', { points: totalPoints })}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
