'use client';

import { CardTheme, themes } from './ThemePicker';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface CardPreviewProps {
  theme: CardTheme;
  recipientName: string;
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  isSending: boolean;
}

const quickPrompts = [
  "Thanks for helping out! 💪",
  "You're so thoughtful! 🌟",
  "Great job today! 🎉",
  "You made my day better! 😊",
];

export function CardPreview({
  theme,
  recipientName,
  message,
  onMessageChange,
  onSend,
  isSending,
}: CardPreviewProps) {
  const selectedTheme = themes.find((t) => t.id === theme);
  const charCount = message.length;
  const maxChars = 140;

  const handleQuickPrompt = (prompt: string) => {
    if (charCount + prompt.length <= maxChars) {
      onMessageChange(message ? `${message} ${prompt}` : prompt);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Write your message
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tell {recipientName} what you appreciate
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
          <div className="text-6xl mb-4">{selectedTheme?.icon}</div>
          <h4 className="text-2xl font-bold text-white mb-2">
            Thank you, {recipientName}!
          </h4>
          {message && (
            <p className="text-white/90 text-lg max-w-md italic">
              &quot;{message}&quot;
            </p>
          )}
          {!message && (
            <p className="text-white/60 text-sm">
              Your message will appear here...
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
            placeholder={`Write a kind message to ${recipientName}...`}
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
              onClick={() => handleQuickPrompt(prompt)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:border-primary-kindness hover:bg-primary-kindness/10 transition-colors text-gray-700 dark:text-gray-300"
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
        className="w-full bg-primary-kindness hover:bg-primary-kindness/90 text-white text-lg py-6 rounded-xl shadow-lg disabled:opacity-50"
      >
        {isSending ? (
          <>
            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
            Sending gratitude...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Send Gratitude
          </>
        )}
      </Button>
    </div>
  );
}
