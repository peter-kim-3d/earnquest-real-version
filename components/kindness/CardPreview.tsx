'use client';

import { CardTheme, themes } from './ThemePicker';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CardPreviewProps {
  theme: CardTheme;
  recipientName: string;
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export function CardPreview({
  theme,
  recipientName,
  message,
  onMessageChange,
  onSend,
  isSending,
}: CardPreviewProps) {
  const t = useTranslations('kindness.cardPreview');
  const selectedTheme = themes.find((t) => t.id === theme);
  const charCount = message.length;
  const maxChars = 140;

  const quickPrompts = [
    t('quickPrompts.helpingOut'),
    t('quickPrompts.thoughtful'),
    t('quickPrompts.greatJob'),
    t('quickPrompts.madeDayBetter'),
  ];

  const handleQuickPrompt = (prompt: string) => {
    if (charCount + prompt.length <= maxChars) {
      onMessageChange(message ? `${message} ${prompt}` : prompt);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t('writeYourMessage')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('tellAppreciation', { name: recipientName })}
        </p>
      </div>

      {/* Card Preview */}
      <div className="relative">
        <div
          className={`
            ${selectedTheme?.gradient}
            rounded-3xl p-8 shadow-2xl
            min-h-52 flex flex-col items-center justify-center
            text-center
          `}
        >
          <div className="text-6xl mb-4" aria-hidden="true">{selectedTheme?.icon}</div>
          <h4 className="text-2xl font-bold text-white mb-2">
            {t('thankYou', { name: recipientName })}
          </h4>
          {message && (
            <p className="text-white/90 text-lg max-w-md italic">
              &quot;{message}&quot;
            </p>
          )}
          {!message && (
            <p className="text-white/60 text-sm">
              {t('messagePlaceholder')}
            </p>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= maxChars) {
                onMessageChange(e.target.value);
              }
            }}
            placeholder={t('writeKindMessage', { name: recipientName })}
            className="min-h-24 resize-none text-base"
            maxLength={maxChars}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-500">
            {charCount}/{maxChars}
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:border-primary-kindness hover:bg-primary-kindness/10 transition-colors text-gray-700 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-kindness focus-visible:ring-offset-2"
              disabled={isSending}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Send Button */}
      <Button
        onClick={onSend}
        disabled={!message.trim() || isSending}
        aria-busy={isSending}
        className="w-full bg-primary-kindness hover:bg-primary-kindness/90 text-white text-lg py-6 rounded-xl shadow-lg disabled:opacity-50"
      >
        {isSending ? (
          <>
            <Sparkles className="w-5 h-5 mr-2 motion-safe:animate-spin" aria-hidden="true" />
            {t('sendingGratitude')}
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
            {t('sendGratitude')}
          </>
        )}
      </Button>
    </div>
  );
}
