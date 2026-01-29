'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { FIX_TEMPLATES, type FixRequestTemplate } from '@/lib/types/task';
import { getErrorMessage } from '@/lib/utils/error';

interface FixRequestModalProps {
  completionId: string;
  taskName: string;
  templateKey?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FixRequestModal({
  completionId,
  taskName,
  templateKey,
  isOpen,
  onClose,
}: FixRequestModalProps) {
  const router = useRouter();
  const t = useTranslations('tasks.fixRequest');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');

  // Get fix templates for this task (or use default)
  const taskTemplates = templateKey && FIX_TEMPLATES[templateKey]
    ? FIX_TEMPLATES[templateKey]
    : FIX_TEMPLATES.default;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0 && !customMessage.trim()) {
      toast.error(t('toast.selectionRequired'), { description: t('toast.selectAtLeastOne') });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tasks/fix-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionId,
          items: selectedItems,
          message: customMessage.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send fix request');
      }

      router.refresh();
      onClose();
      setSelectedItems([]);
      setCustomMessage('');
    } catch (error: unknown) {
      console.error('Error sending fix request:', error);
      toast.error(t('toast.requestFailed'), { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (text: string) => {
    if (selectedItems.includes(text)) {
      setSelectedItems(selectedItems.filter((item) => item !== text));
    } else {
      if (selectedItems.length < 5) {
        setSelectedItems([...selectedItems, text]);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t('title', { taskName })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Template Fix Items */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('quickFixes')}
            </Label>
            <div className="space-y-2">
              {taskTemplates.map((template: FixRequestTemplate) => {
                const isSelected = selectedItems.includes(template.text);
                return (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => toggleItem(template.text)}
                    disabled={!isSelected && selectedItems.length >= 5}
                    aria-pressed={isSelected}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${!isSelected && selectedItems.length >= 5
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                      }`}
                  >
                    <span className="text-2xl flex-shrink-0" aria-hidden="true">{template.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {template.text}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="text-primary text-lg flex-shrink-0" aria-hidden="true">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('addCustomMessage')}
            </Label>
            <Textarea
              id="customMessage"
              name="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t('customPlaceholder')}
              className="min-h-20"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('characters', { count: customMessage.length })}
            </p>
          </div>

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                {t('selectedFixes', { count: selectedItems.length })}
              </p>
              <ul className="space-y-1">
                {selectedItems.map((item, index) => (
                  <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || (selectedItems.length === 0 && !customMessage.trim())}
              aria-busy={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" aria-hidden="true" />}
              {loading ? t('sending') : t('sendRequest')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
