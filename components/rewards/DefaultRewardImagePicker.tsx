'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DEFAULT_REWARD_IMAGES, DEFAULT_REWARD_IMAGE_CATEGORIES, DefaultRewardImage } from '@/lib/default-reward-images';
import { useTranslations } from 'next-intl';

interface DefaultRewardImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  selectedImageUrl?: string | null;
}

export default function DefaultRewardImagePicker({
  open,
  onClose,
  onSelect,
  selectedImageUrl,
}: DefaultRewardImagePickerProps) {
  const t = useTranslations('rewards.imagePicker');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredImages =
    activeCategory === 'all'
      ? DEFAULT_REWARD_IMAGES
      : DEFAULT_REWARD_IMAGES.filter((img) => img.category === activeCategory);

  const handleSelect = (image: DefaultRewardImage) => {
    onSelect(image.url);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            aria-pressed={activeCategory === 'all'}
            className={`px-3 py-2 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              activeCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t('all')}
          </button>
          {DEFAULT_REWARD_IMAGE_CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              aria-pressed={activeCategory === category.id}
              className={`px-3 py-2 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                activeCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
          {filteredImages.map((image) => {
            const isSelected = selectedImageUrl === image.url;

            return (
              <button
                type="button"
                key={image.id}
                onClick={() => handleSelect(image)}
                aria-label={image.name}
                aria-pressed={isSelected}
                className={`aspect-square min-w-[60px] min-h-[60px] rounded-xl border-2 overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.name}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
