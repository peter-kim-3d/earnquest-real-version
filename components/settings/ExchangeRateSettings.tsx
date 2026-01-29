'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Coins, Info, WarningCircle, CircleNotch } from '@phosphor-icons/react/dist/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  EXCHANGE_RATE_OPTIONS,
  ExchangeRate,
  formatPointsAsDollars,
  getExchangeRateLabel,
} from '@/lib/utils/exchange-rate';
import { useTranslations, useLocale } from 'next-intl';

interface ExchangeRateSettingsProps {
  currentRate: ExchangeRate;
}

export default function ExchangeRateSettings({ currentRate }: ExchangeRateSettingsProps) {
  const router = useRouter();
  const t = useTranslations('settings.exchangeRate');
  const locale = useLocale();
  const [selectedRate, setSelectedRate] = useState<ExchangeRate>(currentRate);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRate, setPendingRate] = useState<ExchangeRate | null>(null);

  useEffect(() => {
    setSelectedRate(currentRate);
  }, [currentRate]);

  const handleRateSelect = (rate: ExchangeRate) => {
    if (rate === currentRate) {
      setSelectedRate(rate);
      return;
    }
    setPendingRate(rate);
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    if (!pendingRate) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/family/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointExchangeRate: pendingRate }),
      });

      if (!response.ok) {
        throw new Error('Failed to update exchange rate');
      }

      setSelectedRate(pendingRate);
      setShowConfirmDialog(false);
      toast.success(t('toast.updated'));
      router.refresh();
    } catch (error: unknown) {
      console.error('Error updating exchange rate:', error);
      toast.error(t('toast.updateFailed'));
    } finally {
      setIsLoading(false);
      setPendingRate(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins size={24} className="text-primary" aria-hidden="true" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info box */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Info size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-blue-700 dark:text-blue-300">{t('info')}</p>
          </div>

          {/* Reference note - important guidance */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <WarningCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{t('referenceNote')}</p>
          </div>

          {/* Rate selection */}
          <div className="grid gap-2">
            {EXCHANGE_RATE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRateSelect(option.value)}
                aria-pressed={selectedRate === option.value}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  selectedRate === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-left">
                  <span className="font-semibold">{getExchangeRateLabel(option.value, locale)}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t(`options.${option.value}`)}</p>
                </div>
                {selectedRate === option.value && (
                  <span className="text-primary font-semibold">{t('current')}</span>
                )}
              </button>
            ))}
          </div>

          {/* Example calculation */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('exampleTitle')}
            </p>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>
                500 XP = {formatPointsAsDollars(500, selectedRate, locale)}
              </p>
              <p>
                1000 XP = {formatPointsAsDollars(1000, selectedRate, locale)}
              </p>
              <p>
                2000 XP = {formatPointsAsDollars(2000, selectedRate, locale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WarningCircle size={24} className="text-yellow-500" aria-hidden="true" />
              {t('confirm.title')}
            </DialogTitle>
            <DialogDescription>{t('confirm.description')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">{t('confirm.warning')}</p>
            </div>
            {pendingRate && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-500">{t('confirm.from')}</span>{' '}
                  <span className="font-semibold">{getExchangeRateLabel(currentRate, locale)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">{t('confirm.to')}</span>{' '}
                  <span className="font-semibold text-primary">{getExchangeRateLabel(pendingRate, locale)}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>
              {t('confirm.cancel')}
            </Button>
            <Button onClick={handleConfirmChange} disabled={isLoading} aria-busy={isLoading}>
              {isLoading && <CircleNotch size={16} className="mr-2 motion-safe:animate-spin" aria-hidden="true" />}
              {isLoading ? t('confirm.updating') : t('confirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
