'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const COLORS = [
    { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
    { name: 'Violet', value: '#8b5cf6', class: 'bg-violet-500' },
    { name: 'Purple', value: '#a855f7', class: 'bg-purple-500' },
    { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
    { name: 'Rose', value: '#f43f5e', class: 'bg-rose-500' },
    { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
    { name: 'Orange', value: '#f97316', class: 'bg-orange-500' },
    { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
    { name: 'Yellow', value: '#eab308', class: 'bg-yellow-500' },
    { name: 'Lime', value: '#84cc16', class: 'bg-lime-500' },
    { name: 'Green', value: '#22c55e', class: 'bg-green-500' },
    { name: 'Emerald', value: '#10b981', class: 'bg-emerald-500' },
    { name: 'Teal', value: '#14b8a6', class: 'bg-teal-500' },
    { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
    { name: 'Sky', value: '#0ea5e9', class: 'bg-sky-500' },
    { name: 'Gray', value: '#6b7280', class: 'bg-gray-500' },
];

interface ColorPickerProps {
    value?: string;
    onChange: (color: string) => void;
    className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
    const selectedColor = COLORS.find((c) => c.value === value) || COLORS[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('w-full justify-between', className)}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-700"
                            style={{ backgroundColor: value || selectedColor.value }}
                        />
                        <span>{selectedColor.name}</span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-3">
                <div className="grid grid-cols-5 gap-2">
                    {COLORS.map((color) => (
                        <DropdownMenuItem
                            key={color.value}
                            onSelect={() => onChange(color.value)}
                            className={cn(
                                'h-8 w-8 rounded-full border border-transparent hover:scale-110 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer p-0',
                                value === color.value && 'border-black dark:border-white ring-2 ring-offset-2'
                            )}
                            style={{ backgroundColor: color.value }}
                        >
                            {value === color.value && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
