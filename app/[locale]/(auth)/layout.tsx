'use client';

import { ReactNode } from 'react';
import BetaBadge from '@/components/BetaBadge';
import { Sword } from '@phosphor-icons/react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ModeToggle } from '@/components/ModeToggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left Panel: Hero/Marketing (Hidden on Mobile) */}
      <div
        className="relative hidden lg:flex w-full lg:w-1/2 flex-col justify-between bg-cover bg-center p-12 xl:p-16 overflow-hidden"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBON1D5gP2EDq8zLzLUNX7BxkVtfVzGikQF9u6z6tI018lpvUDXxREW4oqgeblJSCFSKlEMv4mf5caZTBzE67XSWwVQAbXDAoVlY6iwVGDHIvhpt_VpJLFSlPasv87pCYo10eHVme1NEclZ-nF_YwrJUEr8RUGDVchv2RPaZOZ8aEauq6E4hCxdJPN_8JZFMpRTgINQ5llpg4PlBNinbsO7hpcmGy1IzOuBGiohc_khQUPEmr4JhvZNGboOU-zIlL9roYvpy8WXrz4G')`,
        }}
      >
        {/* Dark Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        {/* Logo area */}
        <div className="relative z-10 flex items-center gap-3 text-white">
          <Sword size={32} weight="duotone" className="text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">EarnQuest</h2>
          <BetaBadge />
        </div>

        {/* Value Prop Content */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl font-black leading-[1.1] tracking-[-0.02em] text-white mb-6 drop-shadow-sm">
            Growing habits, shining rewards
          </h1>
          <p className="text-lg text-white/90 font-medium leading-relaxed mb-4">
            &quot;My kids actually want to finish homework now. Not for the points—they&apos;re proud of the habit they built.&quot;
          </p>
          <p className="text-sm text-white/70 font-medium">
            — Peter
          </p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="relative flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-20 xl:px-32 bg-background-light dark:bg-background-dark">
        {/* Mobile Logo Header */}
        <div className="flex lg:hidden items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-text-main dark:text-white">
            <Sword size={32} weight="duotone" className="text-primary" />
            <h2 className="text-xl font-bold tracking-tight">EarnQuest</h2>
            <BetaBadge />
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>

        {/* Desktop Language/Theme Switcher */}
        <div className="hidden lg:flex items-center gap-1 absolute top-6 right-6">
          <LanguageSwitcher />
          <ModeToggle />
        </div>

        {/* Children (form content) */}
        {children}
      </div>
    </div>
  );
}
