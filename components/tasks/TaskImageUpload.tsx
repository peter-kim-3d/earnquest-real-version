'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface TaskImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  compact?: boolean;
}

export default function TaskImageUpload({
  currentImageUrl,
  onUpload,
  onRemove,
  compact = false,
}: TaskImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image must be smaller than 2MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload to Supabase Storage
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `task-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('task-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('task-images')
        .getPublicUrl(data.path);

      onUpload(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative">
          <div className="relative w-full aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <Image
              src={previewUrl}
              alt="Task image preview"
              fill
              className="object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50 ${
            compact ? 'w-full h-full px-3 py-3' : 'w-full aspect-square max-w-[200px] mx-auto gap-3'
          }`}
        >
          {isUploading ? (
            <Loader2 className={`text-gray-400 animate-spin ${compact ? 'w-6 h-6' : 'w-10 h-10'}`} />
          ) : (
            <>
              {!compact && (
                <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              {compact && <Upload className="w-6 h-6 text-gray-400" />}
              <div className="text-center">
                <p className={`font-medium text-gray-600 dark:text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {compact ? 'Upload Custom' : 'Upload Image'}
                </p>
                {!compact && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    JPEG, PNG, WebP or GIF (max 2MB)
                  </p>
                )}
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {previewUrl && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          className="w-full max-w-[200px] mx-auto flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Change Image
        </Button>
      )}
    </div>
  );
}
