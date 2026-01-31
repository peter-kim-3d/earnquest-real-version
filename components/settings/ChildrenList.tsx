'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus, PencilSimple as Edit2, Trophy, Eye } from '@/components/ui/ClientIcons';
import { ChildFormDialog } from './ChildFormDialog';
import AvatarDisplay from '@/components/profile/AvatarDisplay';

interface Child {
  id: string;
  name: string;
  age_group: string;
  avatar_url: string | null;
  points_balance: number;
  created_at: string;
}

interface ChildrenListProps {
  childrenData: Child[];
  familyId: string;
}

export function ChildrenList({ childrenData, familyId }: ChildrenListProps) {
  const t = useTranslations('settings.children');
  const locale = useLocale();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const handleAddChild = () => {
    setSelectedChild(null);
    setIsDialogOpen(true);
  };

  const handleEditChild = (child: Child) => {
    setSelectedChild(child);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setSelectedChild(null);
    router.refresh();
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    const key = `ageGroupLabels.${ageGroup}` as const;
    return t.has(key) ? t(key) : ageGroup;
  };

  return (
    <div className="space-y-6">
      {/* Add Child Button */}
      <Button
        onClick={handleAddChild}
        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
      >
        <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
        {t('addChild')}
      </Button>

      {/* Children Grid */}
      {childrenData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childrenData.map((child) => (
            <div
              key={child.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AvatarDisplay
                    avatarUrl={child.avatar_url}
                    userName={child.name}
                    size="md"
                    editable={true}
                    mode="child"
                    childId={child.id}
                  />

                  <div>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/children/${child.id}`)}
                      className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors text-left"
                    >
                      {child.name}
                    </button>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getAgeGroupLabel(child.age_group)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/auth/impersonate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ childId: child.id }),
                        });

                        if (!response.ok) throw new Error('Failed to switch view');

                        window.location.href = `/${locale}/child/dashboard`;
                      } catch (error: unknown) {
                        console.error(error);
                      }
                    }}
                    className="h-10 w-10 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={t('viewAsChild')}
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditChild(child)}
                    className="h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={t('editChild')}
                  >
                    <Edit2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Points */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-500" aria-hidden="true" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('questPoints')}
                  </span>
                </div>
                <p className="text-2xl font-black text-yellow-900 dark:text-yellow-100">
                  {t('pointsDisplay', { points: child.points_balance })}
                </p>
              </div>

              {/* Member Since */}
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                {t('memberSince', { date: new Date(child.created_at).toLocaleDateString(locale) })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {t('noChildren')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t('addFirst')}
          </p>
        </div>
      )}

      {/* Child Form Dialog */}
      <ChildFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleSuccess}
        child={selectedChild}
        familyId={familyId}
      />
    </div>
  );
}
