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
    const generatedId = React.useId();
    const contentId = id ? `${id}-content` : generatedId;

    return (
        <div
            id={id}
            className={cn(
                'rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-card-dark transition-all',
                className
            )}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={contentId}
                className={cn(
                    'w-full flex items-center justify-between p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-t-lg',
                    isOpen
                        ? 'bg-gray-50/80 dark:bg-gray-800/80 border-b-2 border-gray-100 dark:border-gray-800'
                        : 'hover:bg-primary/5 hover:border-primary/20 bg-gray-50/50 dark:bg-gray-800/30'
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`} aria-hidden="true">
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
                <div className="text-gray-400" aria-hidden="true">
                    {isOpen ? <CaretDown size={20} /> : <CaretRight size={20} />}
                </div>
            </button>

            {isOpen && (
                <div id={contentId} className="p-4 motion-safe:animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
