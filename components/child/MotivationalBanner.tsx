'use client';

import { RocketLaunch, Medal, Fire, Trophy } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';

// ...

type Child = {
  name: string;
  points_balance: number;
};

interface MotivationalBannerProps {
  child: Child;
}

export default function MotivationalBanner({ child }: MotivationalBannerProps) {
  const t = useTranslations('child.motivation');

  // Get motivational message based on points
  const getMessage = () => {
    const points = child.points_balance;
    if (points === 0) {
      return {
        title: t('startQuest', { name: child.name }),
        subtitle: t('startQuestSubtitle'),
        Icon: RocketLaunch,
      };
    } else if (points < 100) {
      return {
        title: t('greatStart', { name: child.name }),
        subtitle: t('greatStartSubtitle'),
        Icon: Medal,
      };
    } else if (points < 300) {
      return {
        title: t('onFire', { name: child.name }),
        subtitle: t('onFireSubtitle'),
        Icon: Fire,
      };
    } else {
      return {
        title: t('incredible', { name: child.name }),
        subtitle: t('incredibleSubtitle'),
        Icon: Trophy,
      };
    }
  };

  const { title, subtitle, Icon } = getMessage();

  return (
    <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-green-500/20 to-blue-500/20 dark:from-primary/10 dark:via-green-500/10 dark:to-blue-500/10 border border-primary/30 dark:border-primary/40 shadow-lg">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative p-6 md:p-8">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="shrink-0" aria-hidden="true">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <Icon size={32} weight="fill" className="text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-black text-text-main dark:text-white mb-1">
              {title}
            </h2>
            <p className="text-sm md:text-base text-text-muted dark:text-gray-400">
              {subtitle}
            </p>
          </div>

          {/* Trophy Icon (Desktop) */}
          <div className="hidden md:block shrink-0" aria-hidden="true">
            <Trophy className="h-12 w-12 text-primary/30 dark:text-primary/20" weight="duotone" />
          </div>
        </div>
      </div>
    </div>
  );
}
