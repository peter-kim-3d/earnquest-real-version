'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Check } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ImageCropEditor from './ImageCropEditor';
import CameraCapture from './CameraCapture';
import { getCroppedImg } from '@/lib/cropImage';
import { Area } from 'react-easy-crop';
import { PARENT_AVATARS, CHILD_AVATARS } from '@/lib/avatars';
import { getErrorMessage } from '@/lib/utils/error';
import { useTranslations } from 'next-intl';

interface AvatarEditModalProps {
  open: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onAvatarUpdate: (avatarUrl: string) => void;
  mode?: 'parent' | 'child';
  childId?: string; // Required when mode is 'child'
}

export default function AvatarEditModal({
  open,
  onClose,
  currentAvatar,
  onAvatarUpdate,
  mode = 'parent',
  childId,
}: AvatarEditModalProps) {
  const t = useTranslations('common.avatar');
  // Select avatar pool based on mode
  const PRESET_AVATARS = mode === 'child' ? CHILD_AVATARS : PARENT_AVATARS;
  const [uploading, setUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('selectImageFile'));
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('imageSizeLimit'));
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedAreaPixels: Area) => {
    if (!imageSrc) return;

    // Validate childId for child mode
    if (mode === 'child' && !childId) {
      toast.error(t('childIdRequired'));
      return;
    }

    setUploading(true);

    try {
      // Get cropped image as blob
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      if (!croppedBlob) {
        throw new Error('Failed to crop image');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');

      if (mode === 'child' && childId) {
        formData.append('childId', childId);
      }

      // Upload to appropriate API
      const uploadUrl = mode === 'child'
        ? '/api/profile/child-avatar/upload'
        : '/api/profile/avatar/upload';

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Upload failed');
      }

      const { avatarUrl } = await response.json();

      toast.success(t('avatarUpdated'));
      onAvatarUpdate(avatarUrl);
      setShowCropEditor(false);
      setImageSrc(null);
      onClose();
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropEditor(false);
    setImageSrc(null);
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setImageSrc(imageDataUrl);
    setShowCameraCapture(false);
    setShowCropEditor(true);
  };

  const handleCameraCancel = () => {
    setShowCameraCapture(false);
  };

  const handlePresetSelect = async (presetId: string) => {
    // Validate childId for child mode
    if (mode === 'child' && !childId) {
      toast.error(t('childIdRequired'));
      return;
    }

    setSelectedPreset(presetId);

    try {
      // Update avatar to preset using appropriate API
      const presetUrl = mode === 'child'
        ? '/api/profile/child-avatar/preset'
        : '/api/profile/avatar/preset';

      const body = mode === 'child'
        ? JSON.stringify({ presetId, childId })
        : JSON.stringify({ presetId });

      const response = await fetch(presetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      toast.success(t('avatarUpdated'));
      onAvatarUpdate(presetId);
      setTimeout(() => onClose(), 500);
    } catch (error: unknown) {
      console.error('Preset update error:', error);
      toast.error(t('updateFailed'));
    }
  };

  const handleCameraClick = () => {
    setShowCameraCapture(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showCameraCapture
              ? t('takePhoto')
              : showCropEditor
                ? t('adjustPhoto')
                : t('chooseProfilePicture')}
          </DialogTitle>
        </DialogHeader>

        {/* Camera Capture */}
        {showCameraCapture && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onCancel={handleCameraCancel}
          />
        )}

        {/* Crop Editor */}
        {!showCameraCapture && showCropEditor && imageSrc && (
          <ImageCropEditor
            imageSrc={imageSrc}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}

        {/* Main Content (Unified View) */}
        {!showCameraCapture && !showCropEditor && (
          <div className="space-y-6 pt-2">

            {/* Custom Photo Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
                {t('customPhoto')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Camera className="h-6 w-6 text-primary mb-2" aria-hidden="true" />
                  <span className="text-sm font-semibold text-text-main dark:text-white">{t('camera')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Upload className="h-6 w-6 text-primary mb-2" aria-hidden="true" />
                  <span className="text-sm font-semibold text-text-main dark:text-white">{t('upload')}</span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
            </div>

            {/* Presets Gallery */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
                {t('chooseAvatar')}
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {PRESET_AVATARS.map((avatar) => (
                  <button
                    type="button"
                    key={avatar.id}
                    onClick={() => handlePresetSelect(avatar.id)}
                    aria-label={`Select ${avatar.id} avatar`}
                    aria-pressed={selectedPreset === avatar.id || currentAvatar === avatar.id}
                    className={`relative aspect-square rounded-full bg-gradient-to-br ${avatar.color} hover:scale-110 transition-transform flex items-center justify-center overflow-hidden ring-offset-2 dark:ring-offset-gray-900 ${(selectedPreset === avatar.id || currentAvatar === avatar.id)
                      ? 'ring-4 ring-primary'
                      : 'hover:ring-2 hover:ring-primary/50'
                      }`}
                  >
                    {avatar.image ? (
                      <Image
                        src={avatar.image}
                        alt={avatar.id}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                        sizes="(max-width: 768px) 20vw, 100px"
                      />
                    ) : (
                      <span className="text-3xl">{avatar.icon}</span>
                    )}
                    {(selectedPreset === avatar.id || currentAvatar === avatar.id) && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center" aria-hidden="true">
                        <Check className="h-6 w-6 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {uploading && (
              <div className="flex items-center justify-center py-2 text-primary motion-safe:animate-pulse" role="status" aria-live="polite">
                <div className="inline-block motion-safe:animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" aria-hidden="true"></div>
                <span className="text-sm font-medium">{t('processing')}</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
