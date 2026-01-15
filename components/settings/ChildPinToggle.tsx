'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from '@/components/ui/ClientIcons';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ChildPinToggle() {
  const [requirePin, setRequirePin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/family/settings');
      if (res.ok) {
        const { settings } = await res.json();
        setRequirePin(settings.requireChildPin ?? true);
      } else {
        toast.error('Failed to load settings');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setFetching(false);
    }
  };

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
        toast.success(newValue ? 'PIN requirement enabled' : 'PIN requirement disabled');
      } else {
        toast.error('Failed to update setting');
      }
    } catch (err) {
      console.error('Failed to update setting:', err);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-4">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle Section */}
      <div className="flex items-center justify-between py-2">
        <div className="flex-1">
          <p className="font-medium text-text-main dark:text-white">
            Require PIN for Children
          </p>
          <p className="text-sm text-text-muted dark:text-text-muted">
            {requirePin
              ? 'Children must enter a 4-digit PIN to access their dashboard'
              : 'Children can access their dashboard without a PIN'}
          </p>
        </div>
        <button
          onClick={handleToggleClick}
          disabled={loading}
          className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${
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

      {/* Info Box */}
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${
        requirePin
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <span className="text-lg">{requirePin ? '🔒' : '⚠️'}</span>
        <div className="flex-1">
          <p className={`text-sm font-medium mb-1 ${
            requirePin
              ? 'text-green-900 dark:text-green-100'
              : 'text-yellow-900 dark:text-yellow-100'
          }`}>
            {requirePin ? 'PIN Protection Active' : 'PIN Protection Disabled'}
          </p>
          <p className={`text-xs ${
            requirePin
              ? 'text-green-800 dark:text-green-200'
              : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            {requirePin
              ? 'Each child has their own PIN (default: 0000). You can change PINs in child settings.'
              : 'Anyone with your family code can access any child account. Consider enabling PINs for added security.'}
          </p>
        </div>
      </div>

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-main dark:text-white">
              Disable PIN Requirement?
            </DialogTitle>
            <DialogDescription className="text-text-muted dark:text-text-muted">
              This will allow children to access their accounts without entering a PIN code.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Reduced Security
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  Anyone with your family code can access any child&apos;s account.
                  Only disable this if your children&apos;s devices are already secured.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={() => setShowDisableDialog(false)}
              className="px-6 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDisable}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Disabling...' : 'Disable PIN'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
