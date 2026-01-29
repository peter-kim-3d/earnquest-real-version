'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const t = useTranslations('common.camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const checkMultipleCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error: unknown) {
      console.error('Failed to enumerate devices:', error);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: unknown) {
      console.error('Camera access error:', error);
      toast.error(t('cameraError'));
    }
  }, [facingMode, t]);

  useEffect(() => {
    startCamera();
    checkMultipleCameras();

    return () => {
      stopCamera();
    };
  }, [facingMode, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Stop camera and pass image to parent
    stopCamera();
    onCapture(imageDataUrl);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Camera Preview */}
      <div className="relative flex-1 bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label={t('cameraPreview')}
          className="w-full h-full object-cover"
        />

        {/* Circular Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            {/* Dark overlay with circular cutout effect */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <mask id="circle-mask">
                  <rect width="100" height="100" fill="white" />
                  <circle cx="50" cy="50" r="45" fill="black" />
                </mask>
              </defs>
              <rect width="100" height="100" fill="black" opacity="0.5" mask="url(#circle-mask)" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />
            </svg>
          </div>
        </div>

        {/* Switch Camera Button (only show if multiple cameras) */}
        {hasMultipleCameras && (
          <button
            type="button"
            onClick={switchCamera}
            className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={t('switchCamera')}
          >
            <RotateCw className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
        {t('positionFace')}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" aria-hidden="true" />
          {t('cancel')}
        </Button>
        <Button
          type="button"
          onClick={capturePhoto}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          <Camera className="h-4 w-4 mr-2" aria-hidden="true" />
          {t('takePhoto')}
        </Button>
      </div>
    </div>
  );
}
