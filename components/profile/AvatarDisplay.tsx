'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import AvatarEditModal from './AvatarEditModal';
import Image from 'next/image';
import { ALL_AVATARS } from '@/lib/avatars';

interface AvatarDisplayProps {
  avatarUrl: string | null;
  userName: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  mode?: 'parent' | 'child';
  childId?: string; // Required when mode is 'child'
}

const SIZES = {
  sm: { container: 'h-10 w-10', text: 'text-sm', icon: 'text-base', edit: 'h-6 w-6' },
  md: { container: 'h-16 w-16', text: 'text-xl', icon: 'text-2xl', edit: 'h-8 w-8' },
  lg: { container: 'h-24 w-24', text: 'text-4xl', icon: 'text-5xl', edit: 'h-10 w-10' },
};

export default function AvatarDisplay({
  avatarUrl,
  userName,
  size = 'md',
  editable = false,
  mode = 'parent',
  childId,
}: AvatarDisplayProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);

  const sizeClasses = SIZES[size];

  // Check if it's a preset avatar
  const isPreset = currentAvatar?.startsWith('preset:');
  const presetId = isPreset && currentAvatar ? currentAvatar.split(':')[1] : null;
  const preset = presetId ? ALL_AVATARS[presetId] : null;

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setCurrentAvatar(newAvatarUrl);
    // Reload page to update all instances
    window.location.reload();
  };

  return (
    <>
      <div className="relative inline-block">
        {/* Avatar Circle */}
        <div
          className={`${sizeClasses.container} rounded-full bg-gradient-to-br ${preset ? preset.color : 'from-primary to-green-600'
            } p-0.5 ${editable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
          onClick={editable ? () => setShowEditModal(true) : undefined}
        >
          <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
            {currentAvatar && !isPreset && (currentAvatar.startsWith('http://') || currentAvatar.startsWith('https://')) ? (
              // Uploaded image
              <Image
                src={currentAvatar}
                alt={userName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, 96px"
              />
            ) : preset?.image ? (
              // Preset image
              <Image
                src={preset.image}
                alt={userName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, 96px"
              />
            ) : preset ? (
              // Preset emoji (fallback)
              <span className={sizeClasses.icon} aria-hidden="true">{preset.icon}</span>
            ) : (
              // Default: First letter
              <span className={`${sizeClasses.text} font-bold text-primary`}>
                {userName[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>

        {/* Edit Button */}
        {editable && (
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            aria-label={`Edit ${userName}'s avatar`}
            className={`absolute -bottom-1 -right-1 ${sizeClasses.edit} rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Edit Modal */}
      {editable && (
        <AvatarEditModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentAvatar={currentAvatar}
          onAvatarUpdate={handleAvatarUpdate}
          mode={mode}
          childId={childId}
        />
      )}
    </>
  );
}
