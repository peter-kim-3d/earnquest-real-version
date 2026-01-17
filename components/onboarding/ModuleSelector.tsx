'use client';

import { Check, Info } from 'lucide-react';
import { ModuleKey } from '@/lib/types/task';
import { MODULES, getModuleTaskTemplates } from '@/lib/config/modules';
import { useTranslations } from 'next-intl';

interface ModuleSelectorProps {
  enabledModules: ModuleKey[];
  onToggle: (module: ModuleKey) => void;
}

export default function ModuleSelector({ enabledModules, onToggle }: ModuleSelectorProps) {
  const t = useTranslations('onboarding.modules');
  const tCommon = useTranslations('common');
  const moduleOrder: ModuleKey[] = ['hygiene', 'fitness', 'hobby'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-text-muted dark:text-text-muted">
        <Info className="h-4 w-4" />
        <span>{t('subtitle')}</span>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {moduleOrder.map((key) => {
          const taskModule = MODULES[key];
          const isEnabled = enabledModules.includes(key);
          const templates = getModuleTaskTemplates(key);
          const additionalPoints = templates.reduce((sum, t) => sum + t.points, 0);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isEnabled
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  isEnabled ? 'bg-primary text-black' : 'border-2 border-gray-300 dark:border-gray-600'
                }`}
              >
                {isEnabled && <Check className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{taskModule.icon}</span>
                  <h3 className="font-bold text-text-main dark:text-white">{t(`${key}.name`)}</h3>
                </div>
                <p className="text-sm text-text-muted dark:text-text-muted mb-2">{t(`${key}.description`)}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-text-muted">
                    +{t('tasksCount', { count: taskModule.taskKeys.length })}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-text-muted">
                    +{tCommon('points.perDay', { points: additionalPoints })}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
