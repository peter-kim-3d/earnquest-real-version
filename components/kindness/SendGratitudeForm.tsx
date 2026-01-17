'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { RecipientSelector } from './RecipientSelector';
import { ThemePicker, CardTheme } from './ThemePicker';
import { CardPreview } from './CardPreview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface SendGratitudeFormProps {
  recipients: Child[];
  userId: string;
  familyId: string;
}

export function SendGratitudeForm({
  recipients,
  userId,
  familyId,
}: SendGratitudeFormProps) {
  const router = useRouter();
  const t = useTranslations('kindness.form');
  const [step, setStep] = useState(1);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [theme, setTheme] = useState<CardTheme>('cosmic');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedChild = recipients.find((c) => c.id === selectedChildId);

  const handleNext = () => {
    if (step === 1 && !selectedChildId) {
      toast.error(t('selectChild'));
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSend = async () => {
    if (!selectedChildId || !message.trim()) {
      toast.error(t('completeFields'));
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/kindness/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          fromUserId: userId,
          toChildId: selectedChildId,
          message: message.trim(),
          theme,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('sendFailed'));
      }

      toast.success(`${t('sentSuccess')} ❤️`, {
        description: t('sentSuccessDesc', { name: selectedChild?.name || '' }),
      });

      // Reset form
      setSelectedChildId(null);
      setTheme('cosmic');
      setMessage('');
      setStep(1);

      // Optionally redirect
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error('Send gratitude error:', error);
      toast.error(error.message || t('sendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center flex-1">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${num <= step
                  ? 'bg-primary-kindness text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }
              `}
            >
              {num}
            </div>
            {num < 3 && (
              <div
                className={`
                  flex-1 h-1 mx-2
                  ${num < step
                    ? 'bg-primary-kindness'
                    : 'bg-gray-200 dark:bg-gray-700'
                  }
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-96">
        {step === 1 && (
          <RecipientSelector
            recipients={recipients}
            selectedChildId={selectedChildId}
            onSelect={setSelectedChildId}
          />
        )}

        {step === 2 && (
          <ThemePicker selectedTheme={theme} onSelect={setTheme} />
        )}

        {step === 3 && selectedChild && (
          <CardPreview
            theme={theme}
            recipientName={selectedChild.name}
            message={message}
            onMessageChange={setMessage}
            onSend={handleSend}
            isSending={isSending}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {step < 3 && (
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1"
              disabled={isSending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 bg-primary-kindness hover:bg-primary-kindness/90 text-white"
            disabled={step === 1 && !selectedChildId}
          >
            {t('next')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
