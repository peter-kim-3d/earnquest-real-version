'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { FamilyData } from '../FamilyCreationWizard';

type Props = {
    data: FamilyData;
    onUpdate: (data: Partial<FamilyData>) => void;
    onNext: () => void;
    onBack: () => void;
};

type ValueOption = {
    key: string;
    title: string;
    description: string;
    icon: string;
};

const valueOptions: ValueOption[] = [
    {
        key: 'gratitude',
        title: 'Express Gratitude',
        description: 'Saying please and thank you without being reminded.',
        icon: 'handshake',
    },
    {
        key: 'greetings',
        title: 'Family Greetings',
        description: 'Saying good morning and good night to everyone.',
        icon: 'wb_sunny',
    },
    {
        key: 'honesty',
        title: 'Honesty',
        description: 'Telling the truth, even when it is difficult.',
        icon: 'verified',
    },
    {
        key: 'respect',
        title: 'Respect',
        description: 'Listening when others are speaking.',
        icon: 'record_voice_over',
    },
    {
        key: 'clean_spaces',
        title: 'Clean Spaces',
        description: 'Putting your own dishes in the sink after eating.',
        icon: 'cleaning_services',
    },
];

export function FamilyValuesStep({ data, onUpdate, onNext, onBack }: Props) {
    // Initialize with empty array if undefined
    const selectedValues = data.values || [];

    const toggleValue = (key: string) => {
        if (selectedValues.includes(key)) {
            onUpdate({ values: selectedValues.filter((v) => v !== key) });
        } else {
            onUpdate({ values: [...selectedValues, key] });
        }
    };

    const handleNext = () => {
        onNext();
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Family Values</h2>
                <p className="text-gray-600">Choose the core values that matter most to your family</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {valueOptions.map((option) => (
                    <label
                        key={option.key}
                        className={`group relative flex cursor-pointer flex-col gap-4 rounded-xl border-2 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${selectedValues.includes(option.key)
                                ? 'border-quest-purple bg-quest-purple/5 ring-1 ring-quest-purple'
                                : 'border-gray-100 bg-white hover:border-quest-purple/50'
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div
                                className={`flex size-12 items-center justify-center rounded-full text-2xl ${selectedValues.includes(option.key)
                                        ? 'bg-quest-purple text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {/* We can use Phosphor icons or emojis here if Material Symbols aren't set up globally. 
                    Using emoji/text fallback for now or Phosphor if available in project. 
                    Project has @phosphor-icons/react but let's stick to simple first.
                */}
                                <span className="material-symbols-outlined">{option.icon}</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={selectedValues.includes(option.key)}
                                    onChange={() => toggleValue(option.key)}
                                />
                                <div
                                    className={`h-6 w-11 rounded-full transition-all ${selectedValues.includes(option.key)
                                            ? 'bg-quest-purple'
                                            : 'bg-gray-200'
                                        }`}
                                >
                                    <div className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-all ${selectedValues.includes(option.key) ? 'translate-x-full' : ''
                                        }`} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="mb-1 text-lg font-bold text-gray-900">{option.title}</h3>
                            <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                    </label>
                ))}

                {/* Placeholder for custom value - functionality can be added later */}
                <button
                    className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-transparent p-6 text-gray-500 hover:border-quest-purple hover:bg-quest-purple/5 hover:text-quest-purple transition-all"
                    onClick={() => { /* TODO: Open custom value dialog */ }}
                >
                    <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 group-hover:bg-white">
                        <span className="material-symbols-outlined text-2xl">+</span>
                    </div>
                    <span className="font-medium">Add Custom Value</span>
                </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Why Values?</h4>
                <p className="text-sm text-blue-800">
                    Setting clear family values helps children understand expectations and builds a strong family culture.
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
                <Button onClick={onBack} variant="outline" size="lg">
                    Back
                </Button>
                <Button onClick={handleNext} size="lg" className="min-w-[120px]">
                    Next: Add Children
                </Button>
            </div>
        </div>
    );
}
