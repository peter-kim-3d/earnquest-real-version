'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const pathname = usePathname();
    const locale = pathname?.split('/')[1] || 'en-US';
    const t = useTranslations('common.errorPage');

    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <div className="h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <WarningCircle size={48} weight="fill" className="text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                {t('description')}
            </p>
            <div className="flex gap-4">
                <Button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="bg-primary hover:bg-primary/90 text-white font-bold"
                >
                    {t('tryAgain')}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.location.href = `/${locale}/dashboard`}
                >
                    {t('goToDashboard')}
                </Button>
            </div>
        </div>
    );
}
