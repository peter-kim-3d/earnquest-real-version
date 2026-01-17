'use client';

import { useState } from 'react';
import { UserPlus, Copy, Check, Share } from '@/components/ui/ClientIcons';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InviteCoParent() {
  const t = useTranslations('settings.invite');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('createFailed'));
      }

      setInviteUrl(data.invitation.inviteUrl);
      setExpiresAt(data.invitation.expiresAt);
    } catch (error: any) {
      console.error('Invite error:', error);
      toast.error(error.message || t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteUrl) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success(t('linkCopied'));
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Failed to copy');
      }
    }
  };

  const handleShare = async () => {
    if (inviteUrl && navigator.share) {
      try {
        await navigator.share({
          title: t('shareTitle'),
          text: t('shareText'),
          url: inviteUrl,
        });
      } catch (error: any) {
        // User cancelled or share failed - ignore
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const handleReset = () => {
    setInviteUrl(null);
    setExpiresAt(null);
    setCopied(false);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !inviteUrl) {
      // Auto-create invite when dialog opens
      handleCreateInvite();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-black font-semibold">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('button')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-text-muted dark:text-text-muted">{t('creating')}</p>
          </div>
        ) : inviteUrl ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('shareInstructions')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('linkLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0"
                  variant={copied ? 'default' : 'outline'}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-text-muted dark:text-text-muted">
                {t('expiresOn', { date: expiresAt ? new Date(expiresAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '7 days' })}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <Button
                  onClick={handleShare}
                  className="w-full bg-primary hover:bg-primary/90 text-black"
                >
                  <Share className="h-4 w-4 mr-2" />
                  {t('shareLink')}
                </Button>
              )}
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? t('copied') : t('copyLink')}
              </Button>
              <Button
                onClick={handleReset}
                variant="ghost"
                className="w-full"
              >
                {t('done')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-text-muted dark:text-text-muted">
            {t('createFailed')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
