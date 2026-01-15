'use client';

import { useState } from 'react';
import { TASK_ICON_POOL, ICON_CATEGORIES, TaskIcon } from '@/lib/task-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IconPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconId: string) => void;
  selectedIcon?: string;
}

export default function IconPicker({
  open,
  onClose,
  onSelect,
  selectedIcon,
}: IconPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredIcons =
    activeCategory === 'all'
      ? TASK_ICON_POOL
      : TASK_ICON_POOL.filter((icon) => icon.category === activeCategory);

  const handleSelect = (icon: TaskIcon) => {
    onSelect(icon.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose an Icon</DialogTitle>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {ICON_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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
                key={icon.id}
                onClick={() => handleSelect(icon)}
                className={`aspect-square flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                title={icon.name}
              >
                <IconComponent
                  size={28}
                  weight={isSelected ? 'fill' : 'regular'}
                  className={isSelected ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}
                />
                <span className="text-[10px] mt-1 text-gray-500 dark:text-gray-400 truncate w-full text-center">
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
