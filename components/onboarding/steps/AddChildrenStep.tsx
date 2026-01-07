'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { ChildData } from '../FamilyCreationWizard';

type Props = {
  data: ChildData[];
  onUpdate: (children: ChildData[]) => void;
  onNext: () => void;
  onBack: () => void;
};

const avatars = ['👦', '👧', '🧒', '👶', '🦸‍♂️', '🦸‍♀️', '🧙‍♂️', '🧙‍♀️', '🦄', '🐱', '🐶', '🐼', '🦊', '🦁', '🐯', '🐸'];

const ageGroups = [
  { value: '4-7', label: '4-7 years (Early)' },
  { value: '8-11', label: '8-11 years (Middle)' },
  { value: '12-15', label: '12-15 years (Teen)' },
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
      <div className="mb-6 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Who is joining the quest?</h2>
        <p className="text-gray-600">Create a profile for each child. They&apos;ll get their own dashboard to track tasks and rewards.</p>
      </div>

      {errors && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">{errors}</div>
      )}

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {data.map((child, index) => (
          <div
            key={index}
            className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-quest-purple hover:shadow-md transition-all"
          >
            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removeChild(index)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove child"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Avatar Selector */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="relative mb-4 group/avatar">
                  <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center text-6xl shadow-sm border-4 border-white group-hover/avatar:border-quest-purple/20 transition-all">
                    {child.avatar}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-100 text-gray-500 group-hover/avatar:text-quest-purple transition-colors">
                    <span className="material-symbols-outlined text-sm font-bold block">edit</span>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Choose an Avatar</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-4 py-4">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => updateChild(index, { avatar })}
                      className={`text-4xl p-4 rounded-xl hover:bg-gray-100 transition flex items-center justify-center ${child.avatar === avatar ? 'bg-quest-purple/10 ring-2 ring-quest-purple' : ''
                        }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Inputs */}
            <div className="w-full space-y-3">
              <div>
                <Label htmlFor={`child-name-${index}`} className="sr-only">Name</Label>
                <Input
                  id={`child-name-${index}`}
                  placeholder="Child's Name"
                  value={child.name}
                  onChange={(e) => updateChild(index, { name: e.target.value })}
                  className="text-center font-bold text-lg h-12"
                />
              </div>

              <div>
                <Label htmlFor={`child-age-${index}`} className="sr-only">Age Group</Label>
                <select
                  id={`child-age-${index}`}
                  value={child.ageGroup}
                  onChange={(e) => updateChild(index, { ageGroup: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-quest-purple bg-gray-50"
                  aria-label="Select age group"
                >
                  {ageGroups.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        {/* Add Child Button */}
        {(data.length < 6) && (
          <button
            onClick={addChild}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-300 bg-transparent text-gray-500 hover:border-quest-purple hover:bg-quest-purple/5 hover:text-quest-purple transition-all min-h-[300px]"
          >
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <span className="font-bold text-lg">Add Child</span>
            <span className="text-sm mt-1 opacity-70">Up to 6 children</span>
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-600">info</span>
        <div>
          <h4 className="font-semibold text-blue-900 text-sm">Every hero needs a profile</h4>
          <p className="text-xs text-blue-800 mt-1">
            We customize tasks and rewards based on the age group you select. You can always adjust this later.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center border-t border-gray-100 pt-6 mt-8">
        <Button onClick={onBack} variant="ghost" size="lg" className="text-gray-500 hover:text-gray-900">
          Back
        </Button>
        <Button onClick={handleNext} size="lg" className="min-w-[140px] shadow-lg shadow-quest-purple/20 hover:shadow-quest-purple/40 transition-all">
          Next Step
          <span className="material-symbols-outlined ml-2 text-lg">arrow_forward</span>
        </Button>
      </div>
    </div>
  );
}
