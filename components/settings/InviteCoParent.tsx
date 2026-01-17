'use client';

import { useState } from 'react';
import { Envelope as Mail, Copy, Check } from '@/components/ui/ClientIcons';
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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(t('emailRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('createFailed'));
      }

      setInviteUrl(data.invitation.inviteUrl);
      setExpiresAt(data.invitation.expiresAt);
      toast.success(t('createdSuccess'));
    } catch (error: any) {
      console.error('Invite error:', error);
      toast.error(error.message || t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setEmail('');
    setInviteUrl(null);
    setExpiresAt(null);
    setCopied(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-black font-semibold">
          <Mail className="h-4 w-4 mr-2" />
          {t('button')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {!inviteUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                disabled={loading}
              />
              <p className="text-xs text-text-muted dark:text-text-muted">
                {t('emailHelp')}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-black"
              >
                {loading ? t('creating') : t('createInvitation')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                    {t('created')}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t('shareLink', { email })}
                  </p>
                </div>
              </div>
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
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t('copy')}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-text-muted dark:text-text-muted">
                {t('expiresOn', { date: expiresAt ? new Date(expiresAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '7 days' })}
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button onClick={handleReset} className="bg-primary hover:bg-primary/90 text-black">
                {t('done')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
