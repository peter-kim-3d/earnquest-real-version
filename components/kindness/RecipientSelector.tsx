'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check } from 'lucide-react';

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
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Who are we thanking?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose who did something kind
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {recipients.map((child) => {
          const isSelected = selectedChildId === child.id;

          return (
            <button
              key={child.id}
              onClick={() => onSelect(child.id)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all
                ${isSelected
                  ? 'border-primary-kindness bg-primary-kindness/10 dark:bg-primary-kindness/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-kindness/50'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary-kindness rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-primary-kindness/30">
                  <AvatarImage src={child.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xl">
                    {child.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

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
