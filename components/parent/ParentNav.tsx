'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { SquaresFour, Checks, Gift, Heart, Users, List, X, User, Gear, SignOut, CaretDown, Target } from '@phosphor-icons/react';
import BetaBadge from '@/components/BetaBadge';
import AvatarDisplay from '@/components/profile/AvatarDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { ModeToggle } from '@/components/ModeToggle';
import { NotificationBadge } from '@/components/ui/notification-badge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

interface ParentNavProps {
  parentName?: string;
  avatarUrl?: string | null;
}

export default function ParentNav({ parentName = 'Parent', avatarUrl = null }: ParentNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Extract locale from pathname (e.g., /ko-KR/dashboard -> ko-KR)
  const locale = pathname.split('/')[1] || 'en-US';

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { href: `/${locale}/dashboard`, label: t('nav.dashboard'), icon: SquaresFour },
    { href: `/${locale}/tasks`, label: t('nav.tasks'), icon: Checks },
    { href: `/${locale}/rewards`, label: t('nav.rewards'), icon: Gift },
    { href: `/${locale}/goals`, label: t('nav.goals'), icon: Target },
    { href: `/${locale}/settings/children`, label: t('nav.children'), icon: Users },
    { href: `/${locale}/kindness/send`, label: t('nav.kindness'), icon: Heart, isKindness: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm print:hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2"
            aria-label="EarnQuest home - Go to dashboard"
          >
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="EarnQuest Logo" width={32} height={32} />
              <span className="text-xl font-black text-text-main dark:text-white">
                EarnQuest
              </span>
              <BetaBadge />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.isKindness && pathname.startsWith(`/${locale}/kindness`)) ||
                (item.href === `/${locale}/settings/children` && pathname.startsWith(`/${locale}/settings/children`));
              const activeColor = item.isKindness ? 'bg-primary-kindness/10 text-primary-kindness' : 'bg-primary/10 text-primary';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all
                    ${isActive
                      ? `${activeColor} font-bold`
                      : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.isKindness ? (
                    <NotificationBadge showDot dotSize="sm" className="mr-0.5">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </NotificationBadge>
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Profile Avatar */}
          <div className="flex items-center gap-4">
            {/* Mode Toggle & Language Switcher */}
            <div className="hidden md:flex items-center gap-1">
              <LanguageSwitcher />
              <ModeToggle />
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label={`Profile menu for ${parentName}`}
                >
                  <AvatarDisplay
                    avatarUrl={avatarUrl}
                    userName={parentName}
                    size="sm"
                    editable={false}
                  />
                  <CaretDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold text-text-main dark:text-white">
                  {parentName}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile`} className="flex items-center gap-2 cursor-pointer">
                    <User size={18} />
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/settings`} className="flex items-center gap-2 cursor-pointer">
                    <Gear size={18} />
                    {t('nav.settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogoutClick} className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400">
                  <SignOut size={18} />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-12 w-12 flex items-center justify-center text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.isKindness && pathname.startsWith(`/${locale}/kindness`)) ||
                (item.href === `/${locale}/settings/children` && pathname.startsWith(`/${locale}/settings/children`));
              const activeColor = item.isKindness
                ? 'bg-primary-kindness/10 text-primary-kindness border-l-4 border-primary-kindness'
                : 'bg-primary/10 text-primary border-l-4 border-primary';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 font-semibold text-base transition-all
                    ${isActive
                      ? `${activeColor} font-bold`
                      : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Actions Footer */}
            <div className="flex items-center justify-between px-4 py-4 mt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ModeToggle />
              </div>
              <button
                onClick={handleLogoutClick}
                className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                {t('nav.signOut')}
              </button>
            </div>
          </nav>
        )}
      </div>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={performLogout}
        title={t('nav.logoutTitle')}
        description={t('nav.logoutDescription')}
        confirmLabel={t('nav.logout')}
        cancelLabel={t('buttons.cancel')}
        variant="default"
      />
    </header>
  );
}
// Note: We need to wrap the export to use ConfirmDialog, or just add it inside. 
// I will rewrite the component end structure to include ConfirmDialog 
// Since replace_file_content handles chunks, I need to insert imports and the dialog.

// ... import ConfirmDialog ...
// ... state ...
// ... dialog JSX ...
