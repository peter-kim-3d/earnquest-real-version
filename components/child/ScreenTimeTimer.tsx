'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Sparkles, Minimize2, Maximize2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ScreenTimeTimerProps {
  purchaseId: string;
  childId: string;
  rewardName: string;
  screenMinutes: number;
  startedAt: string;
  initialElapsedSeconds?: number;
  initialPausedAt?: string | null;
  initialPausedSeconds?: number;
  onComplete?: () => void;
}

// Save progress every 10 seconds
const SAVE_INTERVAL_MS = 10000;

export default function ScreenTimeTimer({
  purchaseId,
  childId,
  rewardName,
  screenMinutes,
  startedAt,
  initialElapsedSeconds = 0,
  initialPausedAt = null,
  initialPausedSeconds = 0,
  onComplete,
}: ScreenTimeTimerProps) {
  const router = useRouter();
  const t = useTranslations('child.tickets.screenTimer');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isPaused, setIsPaused] = useState(!!initialPausedAt);
  const [isPauseLoading, setIsPauseLoading] = useState(false);
  const hasCompletedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const totalDurationRef = useRef<number>(screenMinutes * 60 * 1000);
  const startTimeRef = useRef<number>(0);
  const savedElapsedRef = useRef<number>(initialElapsedSeconds * 1000);
  const pausedSecondsRef = useRef<number>(initialPausedSeconds);
  const pausedAtRef = useRef<string | null>(initialPausedAt);
  const lastSaveRef = useRef<number>(Date.now());

  // Calculate remaining time based on server timestamps
  const calculateRemaining = useCallback(() => {
    const now = Date.now();
    const started = new Date(startedAt).getTime();
    const pausedMs = pausedSecondsRef.current * 1000;

    // If paused, calculate time up to pause moment
    if (pausedAtRef.current) {
      const pausedTime = new Date(pausedAtRef.current).getTime();
      const elapsed = pausedTime - started - pausedMs;
      return Math.max(0, totalDurationRef.current - elapsed);
    }

    // If running, calculate based on current time minus paused duration
    const elapsed = now - started - pausedMs;
    return Math.max(0, totalDurationRef.current - elapsed);
  }, [startedAt]);

  // Get current elapsed seconds (for saving to DB)
  const getCurrentElapsedSeconds = useCallback(() => {
    const now = Date.now();
    const currentSessionElapsed = startTimeRef.current > 0 ? now - startTimeRef.current : 0;
    const totalElapsedMs = savedElapsedRef.current + currentSessionElapsed;
    return Math.floor(totalElapsedMs / 1000);
  }, []);

  // Save progress to database
  const saveProgress = useCallback(async () => {
    if (isPaused) return; // Don't save while paused

    const elapsedSeconds = getCurrentElapsedSeconds();

    try {
      await fetch(`/api/tickets/${purchaseId}/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, elapsedSeconds }),
      });
      lastSaveRef.current = Date.now();
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  }, [purchaseId, childId, getCurrentElapsedSeconds, isPaused]);

  // Pause handler
  const handlePause = async () => {
    if (isPauseLoading || isPaused) return;

    setIsPauseLoading(true);
    try {
      const response = await fetch(`/api/tickets/${purchaseId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to pause');
      }

      // Update local state
      pausedAtRef.current = data.paused_at;
      setIsPaused(true);

      toast.success(t('pause'));
    } catch (error: any) {
      console.error('Pause error:', error);
      toast.error(error.message || 'Failed to pause');
    } finally {
      setIsPauseLoading(false);
    }
  };

  // Resume handler
  const handleResume = async () => {
    if (isPauseLoading || !isPaused) return;

    setIsPauseLoading(true);
    try {
      const response = await fetch(`/api/tickets/${purchaseId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume');
      }

      // Update local state
      pausedSecondsRef.current = data.paused_seconds;
      pausedAtRef.current = null;
      setIsPaused(false);

      // Recalculate remaining time immediately
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      toast.success(t('resume'));
    } catch (error: any) {
      console.error('Resume error:', error);
      toast.error(error.message || 'Failed to resume');
    } finally {
      setIsPauseLoading(false);
    }
  };

  // Request Wake Lock to prevent screen from sleeping
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock activated');
        }
      } catch (err) {
        console.log('Wake Lock not supported or failed:', err);
      }
    };

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  // Handle visibility change - recalculate time when returning from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Recalculate time based on server timestamps (works even after background)
        const remaining = calculateRemaining();
        setTimeRemaining(remaining);

        // Save progress when coming back from background (if not paused)
        if (!isPaused) {
          saveProgress();
        }

        // Check if timer expired while in background
        if (remaining === 0 && !hasCompletedRef.current) {
          handleTimerComplete();
        }
      } else if (document.visibilityState === 'hidden') {
        // Save progress when going to background (if not paused)
        if (!isPaused) {
          saveProgress();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [calculateRemaining, saveProgress, isPaused]);

  // Main timer effect
  useEffect(() => {
    // Set start time for this session
    startTimeRef.current = Date.now();

    // Calculate initial remaining time
    const remaining = calculateRemaining();
    setTimeRemaining(remaining);

    // If already expired, show confirmation
    if (remaining === 0) {
      handleTimerComplete();
      return;
    }

    // Update timer every second (only if not paused)
    const interval = setInterval(() => {
      if (isPaused) return; // Skip updates when paused

      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      // Periodically save progress (every SAVE_INTERVAL_MS)
      if (Date.now() - lastSaveRef.current >= SAVE_INTERVAL_MS) {
        saveProgress();
      }

      // Show confirmation when timer reaches 0
      if (remaining === 0) {
        clearInterval(interval);
        saveProgress(); // Final save
        handleTimerComplete();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      // Save progress when component unmounts (if not paused)
      if (!isPaused) {
        saveProgress();
      }
    };
  }, [calculateRemaining, saveProgress, isPaused]);

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
          toast.success(t('screenTimeComplete'), {
            description: t('timeWellSpent'),
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

      toast.success(t('screenTimeComplete'), {
        description: t('timeWellSpent'),
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
        toast.error(t('failedToComplete'), {
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

  // Pause/Resume button component
  const PauseResumeButton = ({ size = 'normal' }: { size?: 'normal' | 'small' }) => {
    const iconSize = size === 'small' ? 'h-5 w-5' : 'h-6 w-6';
    const buttonPadding = size === 'small' ? 'p-2' : 'p-3';

    return (
      <button
        onClick={isPaused ? handleResume : handlePause}
        disabled={isPauseLoading}
        className={`${buttonPadding} rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50`}
        aria-label={isPaused ? t('resume') : t('pause')}
      >
        {isPauseLoading ? (
          <div className={`${iconSize} animate-spin rounded-full border-2 border-white border-t-transparent`} />
        ) : isPaused ? (
          <Play className={iconSize} />
        ) : (
          <Pause className={iconSize} />
        )}
      </button>
    );
  };

  // Paused overlay component
  const PausedOverlay = () => (
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-xl">
      <div className="text-center">
        <Pause className="h-12 w-12 mx-auto mb-2 opacity-80" />
        <p className="text-lg font-bold">{t('pause')}</p>
      </div>
    </div>
  );

  // Confirmation dialog content
  const ConfirmationContent = () => (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Sparkles className="h-8 w-8" />
        </div>
      </div>

      {/* Message */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">{t('timesUp')}</h3>
        <p className="text-white/80 mb-4">{rewardName}</p>
        <div className="text-4xl font-black mb-2">
          {t('screenTimeComplete')}
        </div>
        <p className="text-sm text-white/80 tabular-nums">
          {t('autoClosingIn', { seconds: autoCloseSeconds })}
        </p>
      </div>

      {/* Okay Button */}
      <button
        onClick={completeScreenTime}
        disabled={isCompleting}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white text-orange-600 font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isCompleting ? (
          <>{t('processing')}</>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {t('okay')}
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

  // Timer content
  const TimerContent = () => (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Clock className="h-10 w-10" />
        </div>
      </div>

      <div className="text-center mb-2">
        <h3 className="text-xl font-bold">{t('screenTimeActive')}</h3>
        <p className="text-white/80">{rewardName}</p>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8 relative">
        <div className={`text-7xl md:text-8xl font-black mb-2 tabular-nums ${isPaused ? 'opacity-50' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
        <p className="text-lg text-white/80">{t('remainingLabel')}</p>
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold bg-white/20 px-4 py-2 rounded-lg">
              {t('pause')}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-white/20 rounded-full overflow-hidden mb-6">
        <div
          className={`absolute top-0 left-0 h-full bg-white transition-all duration-1000 ${isPaused ? 'opacity-50' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pause/Resume Button */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={isPaused ? handleResume : handlePause}
          disabled={isPauseLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 font-semibold"
        >
          {isPauseLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isPaused ? (
            <>
              <Play className="h-5 w-5" />
              {t('resume')}
            </>
          ) : (
            <>
              <Pause className="h-5 w-5" />
              {t('pause')}
            </>
          )}
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-lg text-white/90">
        <Sparkles className="h-5 w-5" />
        <span>{isPaused ? t('pause') : t('enjoyYourTime')}</span>
      </div>
    </div>
  );

  // Show confirmation dialog when timer completes
  if (showConfirmation) {
    // Confirmation is always fullscreen
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center p-6 text-white motion-safe:animate-pulse">
        <ConfirmationContent />
      </div>
    );
  }

  // Fullscreen mode - covers entire screen to prevent accidental navigation
  if (isFullscreen) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col text-white ${isPaused ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
        {/* Top bar with pause and minimize buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <PauseResumeButton />
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Minimize timer"
          >
            <Minimize2 className="h-6 w-6" />
          </button>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <TimerContent />
        </div>

        {/* Touch protection notice */}
        <div className="text-center pb-6 text-white/60 text-sm">
          {t('tapMinimize') || 'Tap the button above to minimize'}
        </div>
      </div>
    );
  }

  // Minimized card mode
  return (
    <div className={`relative rounded-xl p-6 text-white shadow-lg ${isPaused ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
      {/* Header with buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{t('screenTimeActive')}</h3>
            <p className="text-sm text-white/80">{rewardName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PauseResumeButton size="small" />
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Maximize timer"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6 relative">
        <div className={`text-5xl font-black mb-2 tabular-nums ${isPaused ? 'opacity-50' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
        <p className="text-sm text-white/80">{t('remainingLabel')}</p>
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold bg-white/20 px-3 py-1 rounded-lg">
              {t('pause')}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-white/20 rounded-full overflow-hidden mb-4">
        <div
          className={`absolute top-0 left-0 h-full bg-white transition-all duration-1000 ${isPaused ? 'opacity-50' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-sm text-white/90">
        <Sparkles className="h-4 w-4" />
        <span>{isPaused ? t('pause') : t('enjoyYourTime')}</span>
      </div>
    </div>
  );
}
