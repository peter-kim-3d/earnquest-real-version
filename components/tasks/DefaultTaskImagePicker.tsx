'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DEFAULT_TASK_IMAGES, DEFAULT_TASK_IMAGE_CATEGORIES, DefaultTaskImage } from '@/lib/default-task-images';

interface DefaultTaskImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  selectedImageUrl?: string | null;
}

export default function DefaultTaskImagePicker({
  open,
  onClose,
  onSelect,
  selectedImageUrl,
}: DefaultTaskImagePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredImages =
    activeCategory === 'all'
      ? DEFAULT_TASK_IMAGES
      : DEFAULT_TASK_IMAGES.filter((img) => img.category === activeCategory);

  const handleSelect = (image: DefaultTaskImage) => {
    onSelect(image.url);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a Default Image</DialogTitle>
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
          {DEFAULT_TASK_IMAGE_CATEGORIES.map((category) => (
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

        {/* Image Grid */}
        <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
          {filteredImages.map((image) => {
            const isSelected = selectedImageUrl === image.url;

            return (
              <button
                key={image.id}
                onClick={() => handleSelect(image)}
                className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                }`}
                title={image.name}
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
