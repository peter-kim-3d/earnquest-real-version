'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CaretRight, House } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

const ROUTE_LABELS: Record<string, string> = {
    settings: 'Settings',
    children: 'Children',
    rewards: 'Rewards',
    tasks: 'Tasks',
    profile: 'Profile',
    kindness: 'Kindness',
    send: 'Send Gratitude',
    'add-child': 'Add Child',
    'family-values': 'Family Values',
    'select-style': 'Select Style',
};

export default function Breadcrumbs() {
    const pathname = usePathname();
    const locale = useLocale();

    // Remove locale prefix and split into segments
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    const segments = pathWithoutLocale.split('/').filter(Boolean);

    // If we are at root, don't show breadcrumbs
    if (segments.length === 0) {
        return null;
    }

    // Construct breadcrumb items
    const breadcrumbs = segments.map((segment, index) => {
        const href = `/${locale}/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return {
            href,
            label,
            isLast,
        };
    });

    return (
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center text-sm print:hidden">
            <Link
                href={`/${locale}`}
                className="flex items-center text-text-muted dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
                <House size={16} />
                <span className="sr-only">Home</span>
            </Link>

            {breadcrumbs.map((crumb) => (
                <div key={crumb.href} className="flex items-center">
                    <CaretRight size={12} className="mx-2 text-gray-400" />
                    {crumb.isLast ? (
                        <span className="font-medium text-text-main dark:text-white" aria-current="page">
                            {crumb.label}
                        </span>
                    ) : (
                        <Link
                            href={crumb.href}
                            className="text-text-muted dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
