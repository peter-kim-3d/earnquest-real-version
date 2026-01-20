'use client';

import { useState, useEffect } from 'react';
import { PiggyBank, Target, Sparkle } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => Promise<void>;
  goalName: string;
  currentProgress: number;
  targetPoints: number;
  availableBalance: number;
  isLoading?: boolean;
}

export default function DepositModal({
  isOpen,
  onClose,
  onDeposit,
  goalName,
  currentProgress,
  targetPoints,
  availableBalance,
  isLoading = false,
}: DepositModalProps) {
  const t = useTranslations('goals.deposit');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const pointsRemaining = targetPoints - currentProgress;
  const maxDeposit = Math.min(availableBalance, pointsRemaining);

  // Preset amounts
  const presets = [
    { label: t('presetXp', { amount: 10 }), value: 10 },
    { label: t('presetXp', { amount: 25 }), value: 25 },
    { label: t('presetXp', { amount: 50 }), value: 50 },
    { label: t('all'), value: maxDeposit },
  ].filter((p) => p.value <= maxDeposit && p.value > 0);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  const handleAmountChange = (value: string) => {
    setError('');
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const handlePreset = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handleDeposit = async () => {
    const numAmount = parseInt(amount, 10);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('errors.invalidAmount'));
      return;
    }

    if (numAmount > availableBalance) {
      setError(t('errors.notEnoughPoints'));
      return;
    }

    if (numAmount > pointsRemaining) {
      setError(t('errors.exceedsRemaining'));
      return;
    }

    await onDeposit(numAmount);
  };

  const numAmount = parseInt(amount, 10) || 0;
  const newProgress = currentProgress + numAmount;
  const newProgressPercent = Math.min(
    (newProgress / targetPoints) * 100,
    100
  );
  const willComplete = newProgress >= targetPoints;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank size={24} className="text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description', { goalName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current status */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('goalProgress')}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {currentProgress.toLocaleString()} / {targetPoints.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${(currentProgress / targetPoints) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('xpRemaining', { points: pointsRemaining.toLocaleString() })}
            </p>
          </div>

          {/* Available balance */}
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('yourBalance')}
            </span>
            <span className="text-lg font-bold text-green-700 dark:text-green-400 tabular-nums">
              {availableBalance.toLocaleString()} XP
            </span>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              {t('amountToDeposit')}
            </label>
            <Input
              type="text"
              name="depositAmount"
              inputMode="numeric"
              placeholder={t('enterAmount')}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="text-lg"
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>

          {/* Preset buttons */}
          <div className="flex gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => handlePreset(preset.value)}
                disabled={isLoading}
                className="flex-1"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Preview */}
          {numAmount > 0 && numAmount <= maxDeposit && (
            <div
              className={`p-4 rounded-lg ${
                willComplete
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700'
                  : 'bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {willComplete ? (
                  <>
                    <Sparkle
                      size={20}
                      weight="fill"
                      className="text-yellow-500"
                    />
                    <span className="font-bold text-yellow-700 dark:text-yellow-300">
                      {t('preview.goalComplete')}
                    </span>
                  </>
                ) : (
                  <>
                    <Target size={20} className="text-blue-500" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {t('preview.afterDeposit')}
                    </span>
                  </>
                )}
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    willComplete
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${newProgressPercent}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                {newProgress.toLocaleString()} / {targetPoints.toLocaleString()} XP (
                {Math.round(newProgressPercent)}%)
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={isLoading || numAmount <= 0 || numAmount > maxDeposit}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isLoading ? t('depositing') : numAmount > 0 ? t('depositXp', { amount: numAmount }) : t('deposit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
