'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/lib/utils/error';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AgeGroup = '5-7' | '8-11' | '12-14';

interface Child {
  id: string;
  name: string;
  age_group: string;
  avatar_url: string | null;
  birth_year?: number;
  pin_code?: string;
}

interface ChildFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  child: Child | null;
  familyId: string;
}

export function ChildFormDialog({
  isOpen,
  onClose,
  onSuccess,
  child,
  familyId,
}: ChildFormDialogProps) {
  const t = useTranslations('parent.childForm');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (child) {
      setName(child.name);
      // Determine birth year from age_group if not available (approximate) or use existing field if added
      // Ideally we should have birth_year in Child type. For now, we'll try to use it if passed.
      setBirthYear(child.birth_year?.toString() || '');
      // If PIN is available, use it; otherwise leave empty for new entry
      setPinCode(child.pin_code || '');
    } else {
      setName('');
      setBirthYear('');
      setPinCode('0000');
    }
  }, [child, isOpen]);

  // Helpers for age calculation (matching onboarding logic)
  const calculateAge = (birthdateStr: string): number | null => {
    if (!birthdateStr) return null;
    const today = new Date();
    const birth = new Date(birthdateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeGroupFromAge = (age: number | null): AgeGroup => {
    if (age === null) return '8-11'; // Default
    if (age <= 7) return '5-7';
    if (age <= 11) return '8-11';
    return '12-14';
  };

  const getAgeGroupLabel = (ageGroup: AgeGroup) => {
    const labels = {
      '5-7': { emoji: '🐣', label: t('ageGroups.5-7') },
      '8-11': { emoji: '🚀', label: t('ageGroups.8-11') },
      '12-14': { emoji: '🎓', label: t('ageGroups.12-14') },
    };
    return labels[ageGroup];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }

    if (!birthYear) {
      toast.error(t('birthdateRequired'));
      return;
    }

    if (pinCode && pinCode.length !== 4) {
      toast.error(t('pinInvalid'));
      return;
    }

    setLoading(true);

    try {
      const url = child
        ? '/api/children/update'
        : '/api/children/create';

      const age = calculateAge(birthYear); // birthYear here holds the date string
      const ageGroup = getAgeGroupFromAge(age);

      const response = await fetch(url, {
        method: child ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(child && { childId: child.id }),
          name: name.trim(),
          ageGroup,
          birthdate: birthYear,
          familyId,
          pinCode: pinCode || '0000',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save child');
      }

      toast.success(child ? t('updated') : t('added'));
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Save child error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Calculate current age for display
  const currentAge = birthYear ? calculateAge(birthYear) : null;
  const currentAgeGroup = getAgeGroupFromAge(currentAge);
  const ageGroupInfo = getAgeGroupLabel(currentAgeGroup);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {child ? t('editTitle') : t('addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('nameLabel')}</Label>
            <Input
              id="name"
              name="childName"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Birth Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="birthdate">{t('birthdateLabel')}</Label>
            <Input
              id="birthdate"
              name="birthdate"
              type="date"
              autoComplete="bday"
              value={birthYear} // State variable is birthYear but holds YYYY-MM-DD
              onChange={(e) => setBirthYear(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500">
              {t('birthdateHelp')}
            </p>
          </div>

          {/* Age Info Display */}
          {birthYear && currentAge !== null && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('calculatedInfo')}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{t('yearsOld', { age: currentAge })}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                    <span className="text-2xl" aria-hidden="true">{ageGroupInfo.emoji}</span>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('ageGroupLabel')}</p>
                      <p className="text-sm font-bold text-primary">{ageGroupInfo.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PIN Code */}
          <div className="space-y-2">
            <Label htmlFor="pin">{t('pinLabel')}</Label>
            <Input
              id="pin"
              name="pinCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder={t('pinPlaceholder')}
              value={pinCode || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length <= 4) setPinCode(val);
              }}
              className="font-mono tracking-widest text-center text-lg"
            />
            <p className="text-xs text-gray-500">
              {t('pinHelp')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" aria-hidden="true" />}
              {loading ? t('saving') : child ? t('update') : t('addChild')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
