'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ScreenTimeTimerProps {
  purchaseId: string;
  childId: string;
  rewardName: string;
  screenMinutes: number;
  startedAt: string;
  onComplete?: () => void;
}

export default function ScreenTimeTimer({
  purchaseId,
  childId,
  rewardName,
  screenMinutes,
  startedAt,
  onComplete,
}: ScreenTimeTimerProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(30);
  const hasCompletedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Calculate time remaining
    const startTime = new Date(startedAt).getTime();
    const endTime = startTime + screenMinutes * 60 * 1000;
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);

    setTimeRemaining(remaining);

    // If already expired, show confirmation
    if (remaining === 0) {
      handleTimerComplete();
      return;
    }

    // Update timer every second
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      // Show confirmation when timer reaches 0
      if (remaining === 0) {
        clearInterval(interval);
        handleTimerComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, screenMinutes]);

  // Auto-close confirmation after 30 seconds
  useEffect(() => {
    if (!showConfirmation) return;

    const interval = setInterval(() => {
      setAutoCloseSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          completeScreenTime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showConfirmation]);

  const handleTimerComplete = () => {
    // Play alarm sound
    playAlarmSound();

    // Show confirmation dialog
    setShowConfirmation(true);
    setAutoCloseSeconds(30);
  };

  const playAlarmSound = () => {
    try {
      // Try to play notification sound from public folder
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/timer-complete.mp3');
      }
      audioRef.current.play().catch(() => {
        // If file doesn't exist, generate beep sound with Web Audio API
        playBeepSound();
      });
    } catch {
      // Fallback to beep sound
      playBeepSound();
    }
  };

  const playBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound (3 beeps)
      oscillator.frequency.value = 800; // Hz
      gainNode.gain.value = 0.3;

      oscillator.start(audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Second beep
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 800;
      gain2.gain.value = 0.3;
      osc2.start(audioContext.currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
      osc2.stop(audioContext.currentTime + 0.7);

      // Third beep
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.frequency.value = 1000;
      gain3.gain.value = 0.3;
      osc3.start(audioContext.currentTime + 0.8);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
      osc3.stop(audioContext.currentTime + 1.2);
    } catch (err) {
      console.log('Could not play beep sound:', err);
    }
  };

  const completeScreenTime = async () => {
    // Prevent duplicate calls
    if (isCompleting || hasCompletedRef.current) return;

    hasCompletedRef.current = true;
    setIsCompleting(true);

    try {
      const response = await fetch(`/api/tickets/${purchaseId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If ticket is already used/completed, silently succeed (race condition)
        if (data.error && typeof data.error === 'string' && data.error.includes('not in use')) {
          console.log('Ticket already completed, treating as success');
          toast.success('Screen time complete!', {
            description: 'Time well spent! 🎮',
          });

          // Call onComplete callback for optimistic UI update
          if (onComplete) {
            onComplete();
          }

          router.refresh();
          return;
        }

        throw new Error(data.error || 'Failed to complete screen time');
      }

      toast.success('Screen time complete!', {
        description: 'Time well spent! 🎮',
      });

      // Call onComplete callback for optimistic UI update
      if (onComplete) {
        onComplete();
      }

      // Refresh server data in background
      router.refresh();
    } catch (error: any) {
      // Only show error if it's not the "already completed" case
      if (!error.message?.includes('not in use')) {
        console.error('Complete screen time error:', error);
        toast.error('Failed to complete', {
          description: error.message || 'Please refresh the page.',
        });
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = ((screenMinutes * 60 * 1000 - timeRemaining) / (screenMinutes * 60 * 1000)) * 100;

  // Show confirmation dialog when timer completes
  if (showConfirmation) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 p-6 text-white shadow-lg animate-pulse">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Time&apos;s Up! 🎉</h3>
            <p className="text-sm text-white/80">{rewardName}</p>
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <div className="text-3xl font-black mb-2">
            Screen time complete!
          </div>
          <p className="text-sm text-white/80">
            Auto-closing in {autoCloseSeconds} seconds
          </p>
        </div>

        {/* Okay Button */}
        <button
          onClick={completeScreenTime}
          disabled={isCompleting}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white text-orange-600 font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isCompleting ? (
            <>Processing...</>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Okay
            </>
          )}
        </button>

        {/* Auto-close progress */}
        <div className="mt-4 relative h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all duration-1000"
            style={{ width: `${((30 - autoCloseSeconds) / 30) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Screen Time Active</h3>
          <p className="text-sm text-white/80">{rewardName}</p>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-black mb-2">
          {formatTime(timeRemaining)}
        </div>
        <p className="text-sm text-white/80">Remaining</p>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-white/20 rounded-full overflow-hidden mb-4">
        <div
          className="absolute top-0 left-0 h-full bg-white transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-sm text-white/90">
        <Sparkles className="h-4 w-4" />
        <span>Enjoy your time!</span>
      </div>
    </div>
  );
}
