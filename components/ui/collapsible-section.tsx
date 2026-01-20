'use client';

import * as React from 'react';
import { CaretDown, CaretRight } from '@/components/ui/ClientIcons';
import { cn } from '@/lib/utils';
import type { Icon as IconType } from '@phosphor-icons/react';

interface CollapsibleSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    icon?: IconType;
    className?: string;
    id?: string;
}

export function CollapsibleSection({
    title,
    description,
    children,
    defaultOpen = false,
    icon: Icon,
    className,
    id,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div
            id={id}
            className={cn(
                'rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-card-dark transition-all',
                className
            )}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between p-4 text-left transition-colors',
                    isOpen
                        ? 'bg-gray-50/80 dark:bg-gray-800/80 border-b-2 border-gray-100 dark:border-gray-800'
                        : 'hover:bg-primary/5 hover:border-primary/20 bg-gray-50/50 dark:bg-gray-800/30'
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-text-main dark:text-white">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-sm text-text-muted dark:text-text-muted">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-gray-400">
                    {isOpen ? <CaretDown size={20} /> : <CaretRight size={20} />}
                </div>
            </button>

            {isOpen && (
                <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
