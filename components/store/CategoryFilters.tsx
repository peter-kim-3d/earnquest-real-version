'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/AppIcon';

const categoryIds = ['all', 'screen', 'autonomy', 'experience', 'savings', 'item'] as const;
const categoryIcons: Record<string, string> = {
  all: 'grid_view',
  screen: 'tv',
  autonomy: 'bolt',
  experience: 'celebration',
  savings: 'savings',
  item: 'gift',
};

export default function CategoryFilters() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('child.store.categories');
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      router.push(`/${locale}/child/store`);
    } else {
      router.push(`/${locale}/child/store?category=${categoryId}`);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categoryIds.map((categoryId) => (
        <button
          type="button"
          key={categoryId}
          onClick={() => handleCategoryChange(categoryId)}
          aria-pressed={activeCategory === categoryId}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all shrink-0
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${
              activeCategory === categoryId
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          <AppIcon name={categoryIcons[categoryId]} size={16} weight="duotone" aria-hidden="true" />
          {t(categoryId)}
        </button>
      ))}
    </div>
  );
}
