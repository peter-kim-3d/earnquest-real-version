'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
    children: React.ReactNode;
    count?: number;
    showDot?: boolean;
    className?: string;
    badgeClassName?: string;
    dotSize?: 'sm' | 'md' | 'lg';
}

export function NotificationBadge({
    children,
    count,
    showDot = false,
    className,
    badgeClassName,
    dotSize = 'md',
}: NotificationBadgeProps) {
    const hasContent = (count !== undefined && count > 0) || showDot;

    if (!hasContent) {
        return <>{children}</>;
    }

    return (
        <div className={cn('relative inline-flex', className)}>
            {children}
            {count !== undefined && count > 0 ? (
                <Badge
                    variant="notification"
                    aria-label={`${count > 99 ? 'More than 99' : count} notification${count !== 1 ? 's' : ''}`}
                    className={cn(
                        'absolute -top-1 -right-2 transform transition-all shadow-sm',
                        count > 99 ? 'px-1' : '',
                        badgeClassName
                    )}
                >
                    {count > 99 ? '99+' : count}
                </Badge>
            ) : showDot ? (
                <span
                    role="status"
                    aria-label="New notification"
                    className={cn(
                        'absolute -top-0.5 -right-0.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-900',
                        dotSize === 'sm' ? 'w-2 h-2' : dotSize === 'lg' ? 'w-4 h-4' : 'w-3 h-3',
                        badgeClassName
                    )}
                />
            ) : null}
        </div>
    );
}
