'use client';

import { useEffect, useState } from 'react';
import { Trophy, Sparkle, Star } from '@phosphor-icons/react/dist/ssr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestonePercentage: number;
  bonusPoints: number;
  goalName: string;
}

export default function MilestoneModal({
  isOpen,
  onClose,
  milestonePercentage,
  bonusPoints,
  goalName,
}: MilestoneModalProps) {
  const t = useTranslations('goals.milestone');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-dismiss confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        {/* Confetti animation container */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <span
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  fontSize: `${12 + Math.random() * 12}px`,
                }}
              >
                {['🎉', '⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
              </span>
            ))}
          </div>
        )}

        <DialogHeader className="space-y-4">
          {/* Trophy icon with glow effect */}
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 rounded-full" />
            <div className="relative bg-gradient-to-br from-yellow-300 to-orange-400 p-6 rounded-full">
              <Trophy size={48} weight="fill" className="text-white" />
            </div>
          </div>

          <DialogTitle className="text-2xl font-bold">
            {t('title', { percentage: milestonePercentage })}
          </DialogTitle>

          <DialogDescription className="space-y-2">
            <p className="text-lg">{t('reachedFor', { goalName })}</p>
          </DialogDescription>
        </DialogHeader>

        {/* Bonus points highlight */}
        <div className="my-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkle size={24} weight="fill" className="text-yellow-500" />
            <span className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
              {t('bonusEarned')}
            </span>
            <Sparkle size={24} weight="fill" className="text-yellow-500" />
          </div>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
            +{bonusPoints} XP
          </p>
        </div>

        {/* Motivational message */}
        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
          <Star size={16} weight="fill" className="text-primary" />
          <p className="text-sm">{t('keepGoing')}</p>
          <Star size={16} weight="fill" className="text-primary" />
        </div>

        <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90">
          {t('awesome')}
        </Button>

        <style jsx>{`
          @keyframes confetti {
            0% {
              transform: translateY(-100%) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
          .animate-confetti {
            animation: confetti 3s ease-out forwards;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
