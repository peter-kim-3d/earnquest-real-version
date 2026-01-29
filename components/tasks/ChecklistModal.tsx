'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Square, CheckSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChecklistModalProps {
  taskName: string;
  items: string[];
  isOpen: boolean;
  onComplete: (checklistState: boolean[]) => void;
  onCancel: () => void;
}

export default function ChecklistModal({
  taskName,
  items,
  isOpen,
  onComplete,
  onCancel,
}: ChecklistModalProps) {
  const t = useTranslations('tasks.checklist');
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(items.length).fill(false)
  );

  const completedCount = checkedItems.filter((item) => item).length;
  const totalCount = items.length;
  const allChecked = completedCount === totalCount;
  const progress = (completedCount / totalCount) * 100;

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCheckedItems(new Array(items.length).fill(false));
    }
  }, [isOpen, items.length]);

  const toggleItem = (index: number) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = !newCheckedItems[index];
    setCheckedItems(newCheckedItems);
  };

  const handleComplete = () => {
    if (allChecked) {
      onComplete(checkedItems);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {taskName}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {t('progress')}
              </span>
              <span className="font-bold text-primary">
                {t('complete', { completed: completedCount, total: totalCount })}
              </span>
            </div>
            <div
              className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label={t('progressLabel', { completed: completedCount, total: totalCount })}
            >
              <div
                className={`h-full transition-all duration-300 rounded-full ${allChecked
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-primary to-blue-600'
                  }`}
                style={{ width: `${progress}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('completeAllSteps')}
            </p>
            <div className="space-y-2">
              {items.map((item, index) => {
                const isChecked = checkedItems[index];
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleItem(index)}
                    aria-pressed={isChecked}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isChecked
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    {/* Checkbox Icon */}
                    <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                      {isChecked ? (
                        <CheckSquare className="h-6 w-6 text-primary" />
                      ) : (
                        <Square className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    {/* Item Text */}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium transition-all ${isChecked
                            ? 'text-gray-500 dark:text-gray-400 line-through'
                            : 'text-gray-900 dark:text-gray-100'
                          }`}
                      >
                        {item}
                      </p>
                    </div>

                    {/* Checkmark Animation */}
                    {isChecked && (
                      <div className="flex-shrink-0" aria-hidden="true">
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Completion Message */}
          {allChecked && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                {t('allCompleted')}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!allChecked}
              className={`flex-1 ${allChecked
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
            >
              <Check className="h-5 w-5 mr-2" aria-hidden="true" />
              {t('completeTask')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
