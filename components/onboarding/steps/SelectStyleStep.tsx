'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { FamilyData } from '../FamilyCreationWizard';

type Props = {
    data: FamilyData;
    onUpdate: (data: Partial<FamilyData>) => void;
    onNext: () => void;
    onBack: () => void;
};

type StyleOption = {
    id: 'easy' | 'balanced' | 'learning';
    title: string;
    badge?: string;
    badgeColor?: string;
    headline: string;
    description: string;
    includes: string[];
};

const styles: StyleOption[] = [
    {
        id: 'easy',
        title: 'Easy Start',
        badge: 'Beginner',
        badgeColor: 'bg-green-100 text-green-800',
        headline: 'Gentle Pace',
        description: 'Quick wins to build momentum',
        includes: ['Brush teeth', 'Put away toys', 'Add custom tasks later'],
    },
    {
        id: 'balanced',
        title: 'Balanced',
        badge: 'Most Popular',
        badgeColor: 'bg-quest-purple text-white shadow-sm',
        headline: 'Steady Pace',
        description: 'Daily habits & weekly chores',
        includes: ['Homework', 'Feed the dog', 'Clear table'],
    },
    {
        id: 'learning',
        title: 'Learning Focused',
        badge: 'Advanced',
        badgeColor: 'bg-gray-200 text-gray-800',
        headline: 'Intense Pace',
        description: 'Education & skill building',
        includes: ['Read 30 mins', 'Math practice', 'Science project'],
    },
];

export function SelectStyleStep({ data, onUpdate, onNext, onBack }: Props) {
    const selectedStyle = data.parentingStyle || 'balanced';

    return (
        <div>
            <div className="mb-6 text-center max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Adventure</h2>
                <p className="text-gray-600">Select a starting difficulty level. We&apos;ll set up some initial tasks for you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {styles.map((style) => (
                    <label
                        key={style.id}
                        className={`group relative flex flex-col gap-4 rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${selectedStyle === style.id
                                ? 'border-quest-purple ring-4 ring-quest-purple/10 bg-white shadow-lg'
                                : 'border-gray-200 bg-white hover:border-quest-purple/50 hover:shadow-md'
                            }`}
                    >
                        <input
                            type="radio"
                            name="style_selection"
                            value={style.id}
                            checked={selectedStyle === style.id}
                            onChange={() => onUpdate({ parentingStyle: style.id })}
                            className="peer sr-only"
                        />

                        {/* Active Checkmark */}
                        {selectedStyle === style.id && (
                            <div className="absolute top-[-10px] right-[-10px] bg-quest-purple text-white rounded-full p-1 shadow-md z-10">
                                <span className="material-symbols-outlined text-sm font-bold block">check</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-gray-900 text-lg font-bold leading-tight">{style.title}</h3>
                                {style.badge && (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-1 ${style.badgeColor}`}>
                                        {style.badge}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-1 mb-2">
                                <span className="text-gray-900 text-2xl font-black leading-tight tracking-tight">
                                    {style.headline}
                                </span>
                                <span className="text-green-700 text-sm font-medium leading-tight">
                                    {style.description}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-1"></div>

                        <div className="flex flex-col gap-3 mt-auto">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Includes</p>
                            {style.includes.map((item, i) => (
                                <div key={i} className="text-sm font-normal leading-normal flex items-start gap-3 text-gray-700">
                                    <span className="material-symbols-outlined text-quest-purple text-[20px]">check_circle</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </label>
                ))}
            </div>

            <div className="mt-8 px-4 py-2 text-center">
                <button className="text-green-700 text-sm font-medium underline decoration-dashed underline-offset-4 hover:text-quest-purple transition-colors inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">help_outline</span>
                    Not sure which to pick? Help me choose
                </button>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-6 mt-6">
                <Button onClick={onBack} variant="ghost" size="lg" className="text-gray-500 hover:text-gray-900">
                    <span className="material-symbols-outlined mr-2 text-lg">arrow_back</span>
                    Back
                </Button>
                <Button onClick={onNext} size="lg" className="min-w-[160px] shadow-lg shadow-quest-purple/20 hover:shadow-quest-purple/40 transition-all">
                    Next: Set Rewards
                    <span className="material-symbols-outlined ml-2 text-lg">arrow_forward</span>
                </Button>
            </div>
        </div>
    );
}
