'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { ChildData } from '../FamilyCreationWizard';

type Props = {
  data: ChildData[];
  onUpdate: (children: ChildData[]) => void;
  onNext: () => void;
  onBack: () => void;
};

const avatars = ['👦', '👧', '🧒', '👶', '🦸‍♂️', '🦸‍♀️', '🧙‍♂️', '🧙‍♀️', '🦄', '🐱', '🐶', '🐼'];

const ageGroups = [
  { value: '8-11', label: '8-11 years old' },
  // Can add more age groups later
];

export function AddChildrenStep({ data, onUpdate, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<string | null>(null);

  const addChild = () => {
    onUpdate([
      ...data,
      {
        name: '',
        ageGroup: '8-11',
        avatar: avatars[data.length % avatars.length],
        pointsBalance: 0,
      },
    ]);
  };

  const removeChild = (index: number) => {
    onUpdate(data.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, updates: Partial<ChildData>) => {
    const newChildren = [...data];
    newChildren[index] = { ...newChildren[index], ...updates };
    onUpdate(newChildren);
  };

  const handleNext = () => {
    // Validate
    if (data.length === 0) {
      setErrors('Please add at least one child');
      return;
    }

    const hasEmptyNames = data.some((child) => !child.name.trim());
    if (hasEmptyNames) {
      setErrors('All children must have a name');
      return;
    }

    setErrors(null);
    onNext();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Your Children</h2>
        <p className="text-gray-600">Create profiles for each child in your family</p>
      </div>

      {errors && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errors}</div>
      )}

      {/* Children List */}
      <div className="space-y-4 mb-6">
        {data.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-gray-500 mb-4">No children added yet</p>
            <Button onClick={addChild} variant="outline">
              + Add First Child
            </Button>
          </Card>
        ) : (
          data.map((child, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-4 items-start">
                {/* Avatar Selector */}
                <div className="flex-shrink-0">
                  <Label className="text-xs mb-2 block">Avatar</Label>
                  <div className="grid grid-cols-4 gap-1 max-w-[120px]">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => updateChild(index, { avatar })}
                        className={`text-2xl p-1 rounded hover:bg-gray-100 transition ${
                          child.avatar === avatar ? 'bg-quest-purple/10 ring-2 ring-quest-purple' : ''
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Child Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor={`child-name-${index}`}>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`child-name-${index}`}
                      placeholder="Child's name"
                      value={child.name}
                      onChange={(e) => updateChild(index, { name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`child-age-${index}`}>Age Group</Label>
                    <select
                      id={`child-age-${index}`}
                      value={child.ageGroup}
                      onChange={(e) => updateChild(index, { ageGroup: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-quest-purple"
                    >
                      {ageGroups.map((group) => (
                        <option key={group.value} value={group.value}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor={`child-points-${index}`}>Starting Points</Label>
                    <Input
                      id={`child-points-${index}`}
                      type="number"
                      min="0"
                      value={child.pointsBalance}
                      onChange={(e) => updateChild(index, { pointsBalance: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional: Give them a head start</p>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeChild(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                  aria-label="Remove child"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Another Child Button */}
      {data.length > 0 && data.length < 6 && (
        <Button onClick={addChild} variant="outline" className="w-full mb-6">
          + Add Another Child
        </Button>
      )}

      {data.length >= 6 && (
        <p className="text-sm text-gray-500 text-center mb-6">
          Maximum 6 children for now. Contact support if you need more.
        </p>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pick fun avatars your kids will love</li>
          <li>• You can edit profiles anytime later</li>
          <li>• Starting points are optional - most families start at 0</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Back
        </Button>
        <Button onClick={handleNext} size="lg" className="min-w-[120px]">
          Next: Select Tasks
        </Button>
      </div>
    </div>
  );
}
