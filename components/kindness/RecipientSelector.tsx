'use client';

import { Check } from 'lucide-react';
import AvatarDisplay from '@/components/profile/AvatarDisplay';
import { useTranslations } from 'next-intl';

interface Child {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface RecipientSelectorProps {
  recipients: Child[];
  selectedChildId: string | null;
  onSelect: (childId: string) => void;
}

export function RecipientSelector({
  recipients,
  selectedChildId,
  onSelect,
}: RecipientSelectorProps) {
  const t = useTranslations('kindness.recipient');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t('title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {recipients.map((child) => {
          const isSelected = selectedChildId === child.id;

          return (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(child.id)}
              aria-pressed={isSelected}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-kindness focus-visible:ring-offset-2
                hover:scale-[1.02] hover:shadow-lg
                ${isSelected
                  ? 'border-primary-kindness bg-primary-kindness/10 dark:bg-primary-kindness/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-kindness/50'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary-kindness rounded-full flex items-center justify-center" aria-hidden="true">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <AvatarDisplay
                  avatarUrl={child.avatar_url}
                  userName={child.name}
                  size="md"
                />

                <span className="font-medium text-gray-900 dark:text-white">
                  {child.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
