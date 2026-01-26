'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';

interface LogoutButtonProps {
  locale: string;
  variant?: 'parent' | 'child';
  className?: string;
}

export default function LogoutButton({ locale, variant = 'parent', className }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const endpoint = variant === 'child' ? '/api/auth/child-logout' : '/api/auth/logout';
      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (data.success && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        // Fallback redirect
        const fallbackUrl = variant === 'child' ? `/${locale}/child-login` : `/${locale}/login`;
        router.push(fallbackUrl);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback redirect on error
      const fallbackUrl = variant === 'child' ? `/${locale}/child-login` : `/${locale}/login`;
      router.push(fallbackUrl);
    }
  };

  if (variant === 'child' && className) {
    // Child variant with custom className - simple centered layout
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
        ) : (
          <LogOut className="h-5 w-5 text-red-500" />
        )}
        <span className="font-semibold text-red-500">
          {isLoading ? 'Logging out...' : 'Logout'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={className || "flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group text-left w-full disabled:opacity-50"}
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 text-red-500 animate-spin" />
      ) : (
        <LogOut className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
      )}
      <div className="flex-1">
        <h3 className="font-semibold text-text-main dark:text-white group-hover:text-red-500 transition-colors">
          Logout
        </h3>
        <p className="text-sm text-text-muted dark:text-text-muted">
          Sign out of your account
        </p>
      </div>
    </button>
  );
}
