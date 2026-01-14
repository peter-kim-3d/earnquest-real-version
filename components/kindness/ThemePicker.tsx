'use client';

import { Check } from 'lucide-react';

export type CardTheme = 'cosmic' | 'nature' | 'super_hero' | 'love';

interface Theme {
  id: CardTheme;
  name: string;
  gradient: string;
  icon: string;
}

const themes: Theme[] = [
  {
    id: 'cosmic',
    name: 'Cosmic',
    gradient: 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-700',
    icon: '✨',
  },
  {
    id: 'nature',
    name: 'Nature',
    gradient: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600',
    icon: '🌿',
  },
  {
    id: 'super_hero',
    name: 'Super Hero',
    gradient: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500',
    icon: '⚡',
  },
  {
    id: 'love',
    name: 'Love',
    gradient: 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600',
    icon: '❤️',
  },
];

interface ThemePickerProps {
  selectedTheme: CardTheme;
  onSelect: (theme: CardTheme) => void;
}

export function ThemePicker({ selectedTheme, onSelect }: ThemePickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Pick a vibe
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the card theme that fits best
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className={`
                relative group rounded-2xl border-2 transition-all overflow-hidden
                ${isSelected
                  ? 'border-primary-kindness scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-kindness/50 hover:scale-105'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-primary-kindness rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`${theme.gradient} p-8 h-32 flex items-center justify-center`}>
                <span className="text-5xl">{theme.icon}</span>
              </div>

              <div className="p-3 bg-white dark:bg-gray-800">
                <span className="font-medium text-sm text-gray-900 dark:text-white">
                  {theme.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { themes };
