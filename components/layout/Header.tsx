'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';

export function Header() {
  const t = useTranslations('nav');
  const tApp = useTranslations('app');

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold text-quest-purple">
            {tApp('name')}
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-quest-purple transition-colors"
            >
              {t('dashboard')}
            </Link>
            <Link
              href="/tasks"
              className="text-gray-700 hover:text-quest-purple transition-colors"
            >
              {t('tasks')}
            </Link>
            <Link
              href="/store"
              className="text-gray-700 hover:text-quest-purple transition-colors"
            >
              {t('store')}
            </Link>
          </nav>
        </div>
        <Button variant="ghost" size="sm">
          {t('settings')}
        </Button>
      </div>
    </header>
  );
}
