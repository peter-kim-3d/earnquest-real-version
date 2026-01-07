'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FamilyData } from '../FamilyCreationWizard';

type Props = {
  data: FamilyData;
  onUpdate: (data: Partial<FamilyData>) => void;
  onNext: () => void;
};

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Anchorage', label: 'Alaska Time (US)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (US)' },
  // Can add more or use a library later
];

export function FamilyInfoStep({ data, onUpdate, onNext }: Props) {
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleNext = () => {
    // Validate
    const newErrors: { name?: string } = {};

    if (!data.name.trim()) {
      newErrors.name = 'Family name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create your Family Quest</h1>
        <p className="text-gray-500 font-medium">The first step to building good habits starts here.</p>
      </div>

      <div className="space-y-6">
        {/* Family Name */}
        <div className="space-y-2">
          <Label htmlFor="familyName" className="text-sm font-bold text-gray-900 ml-1">
            Family Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="familyName"
              placeholder="The Smith Family"
              value={data.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className={`rounded-xl border-gray-200 bg-white shadow-sm focus:border-quest-purple focus:ring-quest-purple sm:text-sm h-12 px-4 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {data.name.trim().length > 0 && !errors.name && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
              </div>
            )}
          </div>
          {errors.name && <p className="text-sm text-red-500 ml-1 font-medium">{errors.name}</p>}
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-sm font-bold text-gray-900 ml-1">Timezone</Label>
          <div className="relative">
            <select
              id="timezone"
              value={data.timezone}
              onChange={(e) => onUpdate({ timezone: e.target.value })}
              className="peer block w-full rounded-xl border border-gray-200 bg-white shadow-sm focus:border-quest-purple focus:ring-quest-purple sm:text-sm h-12 px-4 appearance-none"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auto-Approval Hours */}
          <div className="space-y-2">
            <Label htmlFor="autoApprovalHours" className="text-sm font-bold text-gray-900 ml-1">
              Auto-Approval (hours)
            </Label>
            <Input
              id="autoApprovalHours"
              type="number"
              min="1"
              max="168"
              value={data.autoApprovalHours}
              onChange={(e) => onUpdate({ autoApprovalHours: parseInt(e.target.value) || 24 })}
              className="rounded-xl border-gray-200 bg-white shadow-sm focus:border-quest-purple focus:ring-quest-purple sm:text-sm h-12 px-4"
            />
            <p className="text-xs text-gray-500 ml-1">Hours before tasks auto-approve</p>
          </div>

          {/* Weekly Screen Budget */}
          <div className="space-y-2">
            <Label htmlFor="screenBudget" className="text-sm font-bold text-gray-900 ml-1">
              Weekly Screen Budget (min)
            </Label>
            <Input
              id="screenBudget"
              type="number"
              min="0"
              max="10080"
              value={data.screenBudgetWeeklyMinutes}
              onChange={(e) => onUpdate({ screenBudgetWeeklyMinutes: parseInt(e.target.value) || 300 })}
              className="rounded-xl border-gray-200 bg-white shadow-sm focus:border-quest-purple focus:ring-quest-purple sm:text-sm h-12 px-4"
            />
            <p className="text-xs text-gray-500 ml-1">
              {Math.floor(data.screenBudgetWeeklyMinutes / 60)}h {data.screenBudgetWeeklyMinutes % 60}m per week
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
          <span className="material-symbols-outlined text-blue-600 mt-0.5">lightbulb</span>
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-1">Why these settings?</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Auto-approval builds trust with your kids</li>
              <li>Screen time budgets help maintain digital balance</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-quest-purple/20 hover:shadow-quest-purple/40 transition-all flex items-center justify-center gap-2"
        >
          Begin Adventure
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </Button>
      </div>
    </div>
  );
}
