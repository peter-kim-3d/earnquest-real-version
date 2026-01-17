'use client';

import { useState } from 'react';
import { DeviceTabletSpeaker, Play, Pause, Timer } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ScreenTimeBudgetCardProps {
  baseMinutes: number;
  bonusMinutes: number;
  usedMinutes: number;
  dailyLimitMinutes: number;
  usedTodayMinutes: number;
  isSessionActive?: boolean;
  sessionStartTime?: string;
  onStartSession?: () => void;
  onEndSession?: (minutesUsed: number) => void;
  isLoading?: boolean;
}

export default function ScreenTimeBudgetCard({
  baseMinutes,
  bonusMinutes,
  usedMinutes,
  dailyLimitMinutes,
  usedTodayMinutes,
  isSessionActive = false,
  sessionStartTime,
  onStartSession,
  onEndSession,
  isLoading = false,
}: ScreenTimeBudgetCardProps) {
  const t = useTranslations('child.store.screenBudget');
  const [sessionMinutes, setSessionMinutes] = useState(0);

  const totalWeeklyMinutes = baseMinutes + bonusMinutes;
  const remainingWeekly = Math.max(totalWeeklyMinutes - usedMinutes, 0);
  const remainingToday = Math.max(dailyLimitMinutes - usedTodayMinutes, 0);
  const availableNow = Math.min(remainingWeekly, remainingToday);

  const weeklyPercent = totalWeeklyMinutes > 0
    ? Math.min((usedMinutes / totalWeeklyMinutes) * 100, 100)
    : 0;
  const dailyPercent = dailyLimitMinutes > 0
    ? Math.min((usedTodayMinutes / dailyLimitMinutes) * 100, 100)
    : 0;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleEndSession = () => {
    if (onEndSession) {
      onEndSession(sessionMinutes);
      setSessionMinutes(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-6 shadow-card hover:shadow-card-hover transition-all duration-normal">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
            {t('title')}
          </h3>
          <DeviceTabletSpeaker size={24} weight="duotone" className="text-white/80" />
        </div>

        {/* Available Now */}
        <p className="text-4xl font-black text-white mb-1">
          {formatTime(availableNow)}
        </p>
        <p className="text-lg text-white/80 font-medium mb-4">
          {t('availableNow')}
        </p>

        {/* Daily Gauge */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-white/70">{t('today')}</span>
            <span className="text-xs font-semibold text-white">
              {formatTime(usedTodayMinutes)} / {formatTime(dailyLimitMinutes)}
            </span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dailyPercent >= 100
                  ? 'bg-red-400'
                  : dailyPercent >= 75
                  ? 'bg-yellow-400'
                  : 'bg-white'
              }`}
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
        </div>

        {/* Weekly Gauge */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-white/70">{t('thisWeek')}</span>
            <span className="text-xs font-semibold text-white">
              {formatTime(usedMinutes)} / {formatTime(totalWeeklyMinutes)}
            </span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                weeklyPercent >= 100
                  ? 'bg-red-400'
                  : weeklyPercent >= 75
                  ? 'bg-yellow-400'
                  : 'bg-green-400'
              }`}
              style={{ width: `${weeklyPercent}%` }}
            />
          </div>
        </div>

        {/* Bonus indicator */}
        {bonusMinutes > 0 && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-400/20 backdrop-blur-sm">
            <span className="text-xs font-semibold text-green-300">
              {t('bonusEarned', { time: formatTime(bonusMinutes) })}
            </span>
          </div>
        )}

        {/* Session Controls */}
        {availableNow > 0 ? (
          isSessionActive ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-3 bg-white/20 rounded-lg">
                <Timer size={20} weight="fill" className="text-white animate-pulse" />
                <span className="font-bold text-white">{t('sessionActive')}</span>
              </div>
              <Button
                onClick={handleEndSession}
                disabled={isLoading}
                className="w-full bg-white text-purple-600 hover:bg-white/90"
              >
                <Pause size={18} weight="bold" className="mr-2" />
                {isLoading ? t('ending') : t('endSession')}
              </Button>
            </div>
          ) : (
            <Button
              onClick={onStartSession}
              disabled={isLoading}
              className="w-full bg-white text-purple-600 hover:bg-white/90"
            >
              <Play size={18} weight="fill" className="mr-2" />
              {isLoading ? t('starting') : t('startTimer')}
            </Button>
          )
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 bg-white/10 rounded-lg">
            <span className="text-sm font-medium text-white/70">
              {remainingWeekly <= 0
                ? t('weeklyLimitReached')
                : t('dailyLimitReached')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
