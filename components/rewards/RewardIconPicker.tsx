'use client';

import { useState } from 'react';
import { REWARD_ICON_POOL, REWARD_ICON_CATEGORIES, RewardIcon } from '@/lib/reward-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RewardIconPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconId: string) => void;
  selectedIcon?: string;
}

export default function RewardIconPicker({
  open,
  onClose,
  onSelect,
  selectedIcon,
}: RewardIconPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredIcons =
    activeCategory === 'all'
      ? REWARD_ICON_POOL
      : REWARD_ICON_POOL.filter((icon) => icon.category === activeCategory);

  const handleSelect = (icon: RewardIcon) => {
    onSelect(icon.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a Reward Icon</DialogTitle>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            aria-pressed={activeCategory === 'all'}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              activeCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {REWARD_ICON_CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              aria-pressed={activeCategory === category.id}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                activeCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto">
          {filteredIcons.map((icon) => {
            const IconComponent = icon.component;
            const isSelected = selectedIcon === icon.id;

            return (
              <button
                type="button"
                key={icon.id}
                onClick={() => handleSelect(icon)}
                aria-label={icon.name}
                aria-pressed={isSelected}
                className={`aspect-square flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <IconComponent
                  size={28}
                  weight={isSelected ? 'fill' : 'regular'}
                  className={isSelected ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}
                  aria-hidden="true"
                />
                <span className="text-[10px] mt-1 text-gray-500 dark:text-gray-400 truncate w-full text-center" aria-hidden="true">
                  {icon.name}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
