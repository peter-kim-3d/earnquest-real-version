'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SquaresFour, Checks, Gift, Heart, Users, List, X, User, Gear, SignOut, CaretDown, Sword, Target } from '@phosphor-icons/react';
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
// Language switcher disabled for beta - will be enabled after Korean translation is complete
// import LanguageSwitcher from '@/components/LanguageSwitcher';

interface ParentNavProps {
  parentName?: string;
  avatarUrl?: string | null;
}

export default function ParentNav({ parentName = 'Parent', avatarUrl = null }: ParentNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/en-US/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { href: '/en-US/dashboard', label: 'Dashboard', icon: SquaresFour },
    { href: '/en-US/tasks', label: 'Tasks', icon: Checks },
    { href: '/en-US/rewards', label: 'Rewards', icon: Gift },
    { href: '/en-US/goals', label: 'Goals', icon: Target },
    { href: '/en-US/settings/children', label: 'Children', icon: Users },
    { href: '/en-US/kindness/send', label: 'Kindness', icon: Heart, isKindness: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm print:hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/en-US/dashboard"
            className="flex items-center gap-2"
            aria-label="EarnQuest home - Go to dashboard"
          >
            <div className="flex items-center gap-2">
              <Sword size={32} weight="duotone" className="text-primary" />
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
                (item.isKindness && pathname.startsWith('/en-US/kindness')) ||
                (item.href === '/en-US/settings/children' && pathname.startsWith('/en-US/settings/children'));
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
            {/* Mode Toggle (Language switcher disabled for beta) */}
            <div className="hidden md:flex items-center gap-1">
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
                  <Link href="/en-US/profile" className="flex items-center gap-2 cursor-pointer">
                    <User size={18} />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/en-US/settings" className="flex items-center gap-2 cursor-pointer">
                    <Gear size={18} />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogoutClick} className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400">
                  <SignOut size={18} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-12 w-12 flex items-center justify-center text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
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
                (item.isKindness && pathname.startsWith('/en-US/kindness')) ||
                (item.href === '/en-US/settings/children' && pathname.startsWith('/en-US/settings/children'));
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
                <ModeToggle />
              </div>
              <button
                onClick={handleLogoutClick}
                className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </nav>
        )}
      </div>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={performLogout}
        title="Log Out?"
        description="Are you sure you want to log out of specific parent account?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        variant="default" // Logout is not 'danger' usually, but 'default' is fine. Maybe text-red? 'danger' is better for semantics.
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
