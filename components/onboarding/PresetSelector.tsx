'use client';

import { CheckCircle2, Plus, Clock, BookOpen, Trophy, Tv } from 'lucide-react';

export type PresetKey = 'busy' | 'balanced' | 'academic' | 'screen';

interface Preset {
  key: PresetKey;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  badge: string;
  badgeColor: string;
  taskCount: number;
  recommended: boolean;
  examples: string[];
  expectedDailyPoints: {
    min: number;
    max: number;
  };
}

const PRESETS: Preset[] = [
  {
    key: 'busy',
    name: 'Busy Parent',
    tagline: 'Minimal management, maximum impact',
    description: 'Just 3 essential tasks',
    icon: '⏰',
    badge: 'Quick Start',
    badgeColor: 'bg-orange-200 text-orange-900',
    taskCount: 3,
    recommended: false,
    examples: ['Homework', 'Brush teeth', 'Pack backpack'],
    expectedDailyPoints: { min: 90, max: 120 },
  },
  {
    key: 'balanced',
    name: 'Balanced Growth',
    tagline: 'Build habits across all areas',
    description: '7 tasks covering learning, household & health',
    icon: '⚖️',
    badge: 'Recommended',
    badgeColor: 'bg-primary text-black',
    taskCount: 7,
    recommended: true,
    examples: ['Homework', 'Reading', 'Make bed', 'Clear dishes', 'Exercise'],
    expectedDailyPoints: { min: 200, max: 280 },
  },
  {
    key: 'academic',
    name: 'Academic Focus',
    tagline: 'Prioritize learning & skill development',
    description: '5 tasks with higher learning points',
    icon: '🎓',
    badge: 'High Achiever',
    badgeColor: 'bg-purple-200 text-purple-900',
    taskCount: 5,
    recommended: false,
    examples: ['Homework (60 pts)', 'Reading (40 pts)', 'Practice instrument', 'Exercise'],
    expectedDailyPoints: { min: 180, max: 240 },
  },
  {
    key: 'screen',
    name: 'Screen Time Manager',
    tagline: 'Tight screen budget, earn screen time',
    description: '4 tasks to unlock screen rewards',
    icon: '📱',
    badge: 'Screen Control',
    badgeColor: 'bg-blue-200 text-blue-900',
    taskCount: 4,
    recommended: false,
    examples: ['Homework (70 pts)', 'Clear dishes', 'Brush teeth', 'Exercise'],
    expectedDailyPoints: { min: 160, max: 200 },
  },
];

interface PresetSelectorProps {
  selectedPreset: PresetKey;
  onSelectPreset: (preset: PresetKey) => void;
}

export default function PresetSelector({ selectedPreset, onSelectPreset }: PresetSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {PRESETS.map((preset) => {
        const isSelected = selectedPreset === preset.key;
        const isRecommended = preset.recommended;

        return (
          <label
            key={preset.key}
            className={`group relative flex flex-col gap-4 rounded-xl border-2 border-solid bg-white dark:bg-card-dark p-6 cursor-pointer hover:shadow-lg transition-all duration-200 ${isRecommended
              ? 'ring-4 ring-transparent hover:ring-primary/10 border-gray-200 dark:border-gray-800'
              : 'border-gray-200 dark:border-gray-800 hover:border-primary'
              }`}
          >
            <input
              className="peer sr-only"
              name="preset_selection"
              type="radio"
              value={preset.key}
              checked={isSelected}
              onChange={() => onSelectPreset(preset.key)}
            />

            {/* Active State Border */}
            <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary pointer-events-none" />

            {/* Active State Checkmark */}
            <div className="absolute -top-2.5 -right-2.5 bg-primary text-black rounded-full p-1 hidden peer-checked:block shadow-md z-10">
              <CheckCircle2 className="h-4 w-4" />
            </div>

            <div className="flex flex-col gap-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight">
                  {preset.name}
                </h2>
                <span className={`text-xs font-bold uppercase tracking-wider rounded-full px-2 py-1 ${preset.badgeColor}`}>
                  {preset.badge}
                </span>
              </div>

              {/* Icon & Tagline */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{preset.icon}</span>
                <div className="flex flex-col">
                  <span className="text-text-main dark:text-white text-xl font-black leading-tight tracking-[-0.02em]">
                    {preset.description}
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
                Includes
              </p>
              {preset.examples.slice(0, 3).map((example, index) => (
                <div
                  key={index}
                  className="text-sm font-normal leading-normal flex items-start gap-3 text-text-main dark:text-white"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{example}</span>
                </div>
              ))}
              {preset.examples.length > 3 && (
                <div className="text-sm font-normal leading-normal flex items-start gap-3 text-text-main dark:text-white opacity-50">
                  <Plus className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{preset.examples.length - 3} more tasks</span>
                </div>
              )}
            </div>

            {/* Daily Points Range */}
            <div className="mt-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <p className="text-xs text-text-muted dark:text-text-muted text-center">
                {preset.expectedDailyPoints.min}-{preset.expectedDailyPoints.max} XP/day
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
