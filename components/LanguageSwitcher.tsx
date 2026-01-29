'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from '@phosphor-icons/react/dist/ssr';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const locales = [
    { code: 'en-US', label: 'English', flag: '🇺🇸' },
    { code: 'ko-KR', label: '한국어', flag: '🇰🇷' },
];

export default function LanguageSwitcher() {
    const pathname = usePathname();
    const router = useRouter();

    // Extract current locale from pathname
    const currentLocale = locales.find((l) => pathname.startsWith(`/${l.code}`))?.code || 'en-US';

    const handleLanguageChange = (localeCode: string) => {
        if (localeCode === currentLocale) return;

        // Replace the locale in the pathname
        // Regex matches starts with /xx-XX or /xx-XX/
        const newPathname = pathname.replace(/^\/[a-z]{2}-[A-Z]{2}/, `/${localeCode}`);
        router.push(newPathname);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                    <Globe size={20} className="text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    <span className="sr-only">Switch Language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.code}
                        onClick={() => handleLanguageChange(locale.code)}
                        aria-current={currentLocale === locale.code ? 'true' : undefined}
                        className={`cursor-pointer ${currentLocale === locale.code ? 'bg-primary/10 font-medium' : ''}`}
                    >
                        <span className="mr-2 text-lg" aria-hidden="true">{locale.flag}</span>
                        {locale.label}
                        {currentLocale === locale.code && <span className="sr-only"> (current)</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
