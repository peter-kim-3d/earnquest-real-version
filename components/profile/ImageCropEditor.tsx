'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';

interface ImageCropEditorProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: Area) => void;
  onCancel: () => void;
}

export default function ImageCropEditor({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Crop Area */}
      <div className="relative flex-1 bg-black/90 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
        />
      </div>

      {/* Zoom Controls */}
      <div className="mt-6 px-4">
        <div className="flex items-center gap-4">
          <ZoomOut className="h-5 w-5 text-gray-500 flex-shrink-0" />
          <Slider
            value={[zoom]}
            onValueChange={(value) => setZoom(value[0])}
            min={1}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <ZoomIn className="h-5 w-5 text-gray-500 flex-shrink-0" />
        </div>
        <p className="text-xs text-center text-gray-500 mt-2">
          Drag to reposition, use slider to zoom
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          <Check className="h-4 w-4 mr-2" />
          Confirm
        </Button>
      </div>
    </div>
  );
}
