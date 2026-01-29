'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check } from '@/components/ui/ClientIcons';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AvatarDisplay from '@/components/profile/AvatarDisplay';

interface Child {
  id: string;
  name: string;
  avatar_url: string | null;
  pin_code: string;
}

export default function ChildPinToggle() {
  const t = useTranslations('settings.pinToggle');
  const [requirePin, setRequirePin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [editingPins, setEditingPins] = useState<Record<string, string>>({});
  const [savingPin, setSavingPin] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/family/settings');
      if (res.ok) {
        const { settings, children: childrenData } = await res.json();
        setRequirePin(settings.requireChildPin ?? false);
        if (childrenData) {
          setChildren(childrenData);
          // Initialize editing pins with current values
          const pins: Record<string, string> = {};
          childrenData.forEach((child: Child) => {
            pins[child.id] = child.pin_code || '0000';
          });
          setEditingPins(pins);
        }
      } else {
        toast.error(t('toast.loadFailed'));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      toast.error(t('toast.loadFailed'));
    } finally {
      setFetching(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleClick = () => {
    if (requirePin) {
      // Showing warning before disabling
      setShowDisableDialog(true);
    } else {
      // Enable PIN directly
      updateSetting(true);
    }
  };

  const handleConfirmDisable = async () => {
    setShowDisableDialog(false);
    await updateSetting(false);
  };

  const updateSetting = async (newValue: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/family/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requireChildPin: newValue }),
      });

      if (res.ok) {
        setRequirePin(newValue);
        toast.success(newValue ? t('toast.enabled') : t('toast.disabled'));
      } else {
        toast.error(t('toast.updateFailed'));
      }
    } catch (err) {
      console.error('Failed to update setting:', err);
      toast.error(t('toast.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (childId: string, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    setEditingPins(prev => ({ ...prev, [childId]: cleanValue }));
  };

  const handleSavePin = async (childId: string) => {
    const newPin = editingPins[childId];
    if (!newPin || newPin.length !== 4) {
      toast.error(t('toast.pinMustBe4'));
      return;
    }

    const child = children.find(c => c.id === childId);
    const originalPin = child?.pin_code || '0000';
    if (originalPin === newPin) {
      // No change
      toast.info(t('toast.pinSameAsCurrent'));
      return;
    }

    setSavingPin(childId);
    try {
      const res = await fetch('/api/children/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, pinCode: newPin }),
      });

      if (res.ok) {
        // Update local state
        setChildren(prev => prev.map(c =>
          c.id === childId ? { ...c, pin_code: newPin } : c
        ));
        toast.success(t('toast.pinUpdated', { name: child?.name || '' }));
      } else {
        toast.error(t('toast.updateFailed'));
      }
    } catch (err) {
      console.error('Failed to update PIN:', err);
      toast.error(t('toast.networkError'));
    } finally {
      setSavingPin(null);
    }
  };

  const isPinChanged = (childId: string) => {
    const child = children.find(c => c.id === childId);
    const originalPin = child?.pin_code || '0000';
    const currentPin = editingPins[childId] || '0000';
    return originalPin !== currentPin;
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-4">
        <RefreshCw className="h-5 w-5 motion-safe:animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle Section */}
      <div className="flex items-center justify-between py-2">
        <div className="flex-1">
          <p className="font-medium text-text-main dark:text-white">
            {t('title')}
          </p>
          <p className="text-sm text-text-muted dark:text-text-muted">
            {requirePin
              ? t('descriptionEnabled')
              : t('descriptionDisabled')}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={requirePin}
          aria-label={t('title')}
          onClick={handleToggleClick}
          disabled={loading}
          className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            requirePin ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
              requirePin ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Children PIN Management - Only show when PIN is enabled */}
      {requirePin && children.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium text-text-muted dark:text-text-muted">
            {t('managePins')}
          </p>
          <div className="space-y-2">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <AvatarDisplay
                  avatarUrl={child.avatar_url}
                  userName={child.name}
                  size="sm"
                />
                <span className="flex-1 font-medium text-text-main dark:text-white">
                  {child.name}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name={`pin-${child.id}`}
                    aria-label={`PIN for ${child.name}`}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={editingPins[child.id] || ''}
                    onChange={(e) => handlePinChange(child.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingPins[child.id]?.length === 4) {
                        handleSavePin(child.id);
                      }
                    }}
                    className={`w-20 px-3 py-2 text-center font-mono text-lg tracking-widest rounded-lg border bg-white dark:bg-gray-900 text-text-main dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isPinChanged(child.id)
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="0000"
                  />
                  <button
                    type="button"
                    onClick={() => handleSavePin(child.id)}
                    disabled={savingPin === child.id || !isPinChanged(child.id) || editingPins[child.id]?.length !== 4}
                    aria-busy={savingPin === child.id}
                    className={`p-2 min-h-[44px] min-w-[44px] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      isPinChanged(child.id) && editingPins[child.id]?.length === 4
                        ? 'bg-primary hover:bg-primary/90 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    } disabled:opacity-50`}
                    aria-label={isPinChanged(child.id) ? t('savePin') : t('noChanges')}
                  >
                    {savingPin === child.id ? (
                      <RefreshCw className="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${
        requirePin
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <span className="text-lg" aria-hidden="true">{requirePin ? '🔒' : '⚠️'}</span>
        <div className="flex-1">
          <p className={`text-sm font-medium mb-1 ${
            requirePin
              ? 'text-green-900 dark:text-green-100'
              : 'text-yellow-900 dark:text-yellow-100'
          }`}>
            {requirePin ? t('protectionActive') : t('protectionDisabled')}
          </p>
          <p className={`text-xs ${
            requirePin
              ? 'text-green-800 dark:text-green-200'
              : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            {requirePin
              ? t('infoEnabled')
              : t('infoDisabled')}
          </p>
        </div>
      </div>

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-main dark:text-white">
              {t('disableDialog.title')}
            </DialogTitle>
            <DialogDescription className="text-text-muted dark:text-text-muted">
              {t('disableDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <span className="text-lg" aria-hidden="true">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  {t('disableDialog.warningTitle')}
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  {t('disableDialog.warningDescription')}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setShowDisableDialog(false)}
              className="px-6 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirmDisable}
              disabled={loading}
              aria-busy={loading}
              className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
            >
              {loading ? t('disabling') : t('disablePin')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
