'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trophy, Gift, Medal, Ticket, List, X, User, SignOut, CaretDown, Star, Eye, Target } from '@phosphor-icons/react/dist/ssr';
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
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

interface ChildNavProps {
  childName?: string;
  childId?: string;
  avatarUrl?: string | null;
  points?: number;
  isParentView?: boolean;
}

export default function ChildNav({ childName = 'A', childId, avatarUrl = null, points = 0, isParentView = false }: ChildNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('child.nav');
  const tCommon = useTranslations('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Extract locale from pathname (e.g., /ko-KR/child/dashboard -> ko-KR)
  const locale = pathname.split('/')[1] || 'en-US';

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    try {
      // Clear child session
      await fetch('/api/auth/child-logout', { method: 'POST' });
      router.push(`/${locale}/child-login`);
    } catch (error: unknown) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { href: `/${locale}/child/dashboard`, label: t('quests'), icon: Trophy },
    { href: `/${locale}/child/store`, label: t('rewards'), icon: Gift },
    { href: `/${locale}/child/goals`, label: t('goals'), icon: Target },
    { href: `/${locale}/child/tickets`, label: t('myTickets'), icon: Ticket },
    { href: `/${locale}/child/badges`, label: t('badges'), icon: Medal, isKindness: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col">
      {isParentView && (
        <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>{t('viewingAs', { name: childName })}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              // Clear cookies and go back to parent dashboard
              document.cookie = 'parent_view=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              fetch('/api/auth/child-logout', { method: 'POST' }).then(() => {
                window.location.href = `/${locale}/dashboard`;
              });
            }}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
          >
            {t('exitView')}
          </button>
        </div>
      )}
      <div className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm print:hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href={`/${locale}/child/dashboard`} className="flex items-center gap-2" aria-label="EarnQuest home - Go to dashboard">
              <div className="flex items-center gap-0">
                <Image src="/logo.png" alt="EarnQuest Logo" width={48} height={48} className="-mr-1" />
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
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                const activeColor = item.isKindness ? 'bg-primary-kindness/10 text-primary-kindness' : 'bg-primary/10 text-primary';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all
                      ${isActive
                        ? `${activeColor} font-bold`
                        : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side - XP Badge & Avatar */}
            <div className="flex items-center gap-4">
              {/* Language & Mode Toggle */}
              <div className="hidden sm:flex items-center gap-1">
                <LanguageSwitcher />
                <ModeToggle />
              </div>

              {/* XP Badge */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
                <Star size={20} weight="fill" className="text-yellow-600 dark:text-yellow-500" aria-hidden="true" />
                <span className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
                  {points} XP
                </span>
              </div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full" aria-label={`Profile menu for ${childName}`}>
                    <AvatarDisplay
                      avatarUrl={avatarUrl}
                      userName={childName}
                      size="sm"
                      editable={false}
                      mode="child"
                      childId={childId}
                    />
                    <CaretDown className="h-4 w-4 text-gray-500 hidden sm:block" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold text-text-main dark:text-white">
                    {childName}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/child/profile`} className="flex items-center gap-2 cursor-pointer">
                      <User size={18} aria-hidden="true" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogoutClick} className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400">
                    <SignOut size={18} aria-hidden="true" />
                    {tCommon('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden h-12 w-12 flex items-center justify-center text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={mobileMenuOpen ? tCommon('nav.closeMenu') : tCommon('nav.openMenu')}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <List size={24} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                const activeColor = item.isKindness
                  ? 'bg-primary-kindness/10 text-primary-kindness border-l-4 border-primary-kindness'
                  : 'bg-primary/10 text-primary border-l-4 border-primary';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      flex items-center gap-3 px-4 py-3 font-semibold text-base transition-all
                      ${isActive
                        ? `${activeColor} font-bold`
                        : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={performLogout}
        title={t('logoutTitle')}
        description={t('logoutDescription')}
        confirmLabel={tCommon('nav.logout')}
        cancelLabel={tCommon('buttons.cancel')}
      />
    </header>
  );
}
