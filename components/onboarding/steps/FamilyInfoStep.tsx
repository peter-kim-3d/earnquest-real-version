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
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Family</h2>
        <p className="text-gray-600">Let&apos;s start by setting up your family account</p>
      </div>

      <div className="space-y-6">
        {/* Family Name */}
        <div>
          <Label htmlFor="familyName">
            Family Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="familyName"
            placeholder="The Smith Family"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          <p className="text-sm text-gray-500 mt-1">This is how your family will be identified</p>
        </div>

        {/* Timezone */}
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={data.timezone}
            onChange={(e) => onUpdate({ timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-quest-purple"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Used for task scheduling and reports</p>
        </div>

        {/* Auto-Approval Hours */}
        <div>
          <Label htmlFor="autoApprovalHours">Auto-Approval Time (hours)</Label>
          <Input
            id="autoApprovalHours"
            type="number"
            min="1"
            max="168"
            value={data.autoApprovalHours}
            onChange={(e) => onUpdate({ autoApprovalHours: parseInt(e.target.value) || 24 })}
          />
          <p className="text-sm text-gray-500 mt-1">
            Tasks will auto-approve after this many hours if not reviewed
          </p>
        </div>

        {/* Weekly Screen Budget */}
        <div>
          <Label htmlFor="screenBudget">Weekly Screen Time Budget (minutes)</Label>
          <Input
            id="screenBudget"
            type="number"
            min="0"
            max="10080"
            value={data.screenBudgetWeeklyMinutes}
            onChange={(e) => onUpdate({ screenBudgetWeeklyMinutes: parseInt(e.target.value) || 300 })}
          />
          <p className="text-sm text-gray-500 mt-1">
            Default weekly screen time limit per child: {Math.floor(data.screenBudgetWeeklyMinutes / 60)}h{' '}
            {data.screenBudgetWeeklyMinutes % 60}m
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You can change these settings anytime</li>
            <li>• Screen time limits help maintain healthy digital habits</li>
            <li>• Auto-approval saves time while building trust</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-end">
        <Button onClick={handleNext} size="lg" className="min-w-[120px]">
          Next: Add Children
        </Button>
      </div>
    </div>
  );
}
