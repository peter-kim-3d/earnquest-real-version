'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Smartphone } from '@/components/ui/ClientIcons';
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

export default function DeviceConnection() {
  const t = useTranslations('settings.deviceConnection');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingCode, setFetchingCode] = useState(true);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  useEffect(() => {
    fetchJoinCode();
  }, []);

  const fetchJoinCode = async () => {
    setFetchingCode(true);
    try {
      const res = await fetch('/api/family/join-code');
      if (res.ok) {
        const { joinCode: code } = await res.json();
        setJoinCode(code);
      } else {
        toast.error(t('toast.loadFailed'));
      }
    } catch (err) {
      console.error('Failed to fetch join code:', err);
      toast.error(t('toast.loadFailed'));
    } finally {
      setFetchingCode(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    toast.success(t('toast.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateClick = () => {
    setShowRegenerateDialog(true);
  };

  const handleConfirmRegenerate = async () => {
    setShowRegenerateDialog(false);
    setLoading(true);
    try {
      const res = await fetch('/api/family/join-code', {
        method: 'POST',
      });

      if (res.ok) {
        const { joinCode: newCode } = await res.json();
        setJoinCode(newCode);
        toast.success(t('toast.generated'));
      } else {
        toast.error(t('toast.generateFailed'));
      }
    } catch (err) {
      console.error('Failed to regenerate code:', err);
      toast.error(t('toast.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {fetchingCode ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Join Code Display */}
          <div className="flex items-center gap-3 mb-4">
            <code className="flex-1 text-3xl font-mono tracking-widest bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-lg text-center text-text-main dark:text-white border-2 border-gray-200 dark:border-gray-700">
              {joinCode || '------'}
            </code>

            <button
              onClick={handleCopy}
              className="h-14 w-14 flex items-center justify-center rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
              title={t('copyCode')}
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2 text-sm text-text-muted dark:text-text-muted">
              <span className="mt-0.5">📱</span>
              <span>{t('instructions.childDevice')}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-text-muted dark:text-text-muted">
              <span className="mt-0.5">🔄</span>
              <span>{t('instructions.generateNew')}</span>
            </div>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerateClick}
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium text-text-main dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t('generating') : t('generateNewCode')}
          </button>
        </>
      )}

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-main dark:text-white">
              {t('regenerateDialog.title')}
            </DialogTitle>
            <DialogDescription className="text-text-muted dark:text-text-muted">
              {t('regenerateDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  {t('regenerateDialog.warningTitle')}
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  {t('regenerateDialog.warningDescription')}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={() => setShowRegenerateDialog(false)}
              className="px-6 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold transition-all"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleConfirmRegenerate}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('generating') : t('generateNewCode')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
