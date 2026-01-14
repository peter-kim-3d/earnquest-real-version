'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppIcon } from '@/components/ui/AppIcon';

const categories = [
  { id: 'all', label: 'All Rewards', icon: 'grid_view' },
  { id: 'screen', label: 'Screen Time', icon: 'tv' },
  { id: 'autonomy', label: 'Power Ups', icon: 'bolt' },
  { id: 'experience', label: 'Fun Stuff', icon: 'celebration' },
  { id: 'savings', label: 'Saving', icon: 'savings' },
];

export default function CategoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      router.push('/en-US/child/store');
    } else {
      router.push(`/en-US/child/store?category=${categoryId}`);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryChange(category.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all shrink-0
            ${
              activeCategory === category.id
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          <AppIcon name={category.icon} size={16} weight="duotone" />
          {category.label}
        </button>
      ))}
    </div>
  );
}
