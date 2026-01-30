'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TimerModalProps {
  taskName: string;
  timerMinutes: number;
  points: number;
  initialState?: { remainingSeconds: number; totalSeconds: number };
  isOpen: boolean;
  onComplete: () => void;
  onCancel: () => void;
  onSave?: (state: { remainingSeconds: number; totalSeconds: number }) => void;
}

export default function TimerModal({
  taskName,
  timerMinutes,
  points,
  initialState,
  isOpen,
  onComplete,
  onCancel,
  onSave,
}: TimerModalProps) {
  const t = useTranslations('tasks.timer');
  const [adjustedMinutes, setAdjustedMinutes] = useState(
    initialState ? Math.ceil(initialState.totalSeconds / 60) : timerMinutes
  );
  const [timeLeft, setTimeLeft] = useState(
    initialState ? initialState.remainingSeconds : timerMinutes * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeLeftRef = useRef<number>(0);

  const totalSeconds = adjustedMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Request Wake Lock to prevent screen from sleeping
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && isRunning) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock activated for task timer');
      }
    } catch (err) {
      console.log('Wake Lock not supported or failed:', err);
    }
  }, [isRunning]);

  // Release Wake Lock
  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock released');
    }
  }, []);

  // Sound functions (defined before useEffects that use them)
  const playBeepSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create oscillator for beep sound - 3 beeps
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
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

      // Third beep (higher pitch)
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
  }, []);

  const playAlarmSound = useCallback(() => {
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
  }, [playBeepSound]);

  // Wake Lock management
  useEffect(() => {
    if (isRunning && isOpen) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire wake lock when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && isOpen) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isRunning, isOpen, requestWakeLock, releaseWakeLock]);

  // Handle visibility change - recalculate time when returning from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && startTimeRef.current > 0) {
        // Calculate how much time has actually passed since timer started
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, pausedTimeLeftRef.current - elapsedSeconds);

        setTimeLeft(newTimeLeft);

        // Check if timer expired while in background
        if (newTimeLeft === 0) {
          setIsRunning(false);
          setIsCompleted(true);
          playAlarmSound();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, playAlarmSound]);

  // Timer countdown logic using real time
  useEffect(() => {
    if (isRunning) {
      // Only set start time if not already running (first start or resume)
      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now();
        pausedTimeLeftRef.current = timeLeft;
      }

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, pausedTimeLeftRef.current - elapsedSeconds);

        setTimeLeft(newTimeLeft);

        if (newTimeLeft === 0) {
          setIsRunning(false);
          setIsCompleted(true);
          startTimeRef.current = 0;
          playAlarmSound();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, playAlarmSound]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialState) {
        // Resume mode
        setAdjustedMinutes(Math.ceil(initialState.totalSeconds / 60));
        setTimeLeft(initialState.remainingSeconds);
      } else {
        // Fresh start
        setAdjustedMinutes(timerMinutes);
        setTimeLeft(timerMinutes * 60);
      }
      setIsRunning(false);
      setIsCompleted(false);
      startTimeRef.current = 0;
    }
  }, [isOpen, timerMinutes, initialState]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    // Reset startTimeRef so resume will recalculate from current timeLeft
    startTimeRef.current = 0;
    // Explicit save on pause
    if (onSave) {
      onSave({ remainingSeconds: timeLeft, totalSeconds: adjustedMinutes * 60 });
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(timerMinutes * 60);
    setAdjustedMinutes(timerMinutes);
    setIsCompleted(false);
    startTimeRef.current = 0;
    // Clear saved state
    if (onSave) {
      onSave({ remainingSeconds: timerMinutes * 60, totalSeconds: timerMinutes * 60 });
    }
  };

  const handleComplete = () => {
    if (isCompleted) {
      onComplete();
    }
  };

  // Circular progress SVG
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (!isCompleted && timeLeft < totalSeconds && onSave) {
        onSave({ remainingSeconds: timeLeft, totalSeconds: adjustedMinutes * 60 });
      }
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {taskName}
          </DialogTitle>
          <div className="text-center mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary border border-primary/20">
              + {points} XP
            </span>
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Circular Progress Timer */}
          <div
            className="relative w-48 h-48 mx-auto mb-8"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('timerProgress', { minutes: String(minutes).padStart(2, '0'), seconds: String(seconds).padStart(2, '0') })}
          >
            <svg className="transform -rotate-90 w-48 h-48" aria-hidden="true">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${isCompleted
                  ? 'text-green-500'
                  : isRunning
                    ? 'text-primary'
                    : 'text-orange-400'
                  }`}
              />
            </svg>

            {/* Timer Display */}
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-5xl font-bold text-text-main dark:text-white tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-text-muted dark:text-gray-400 mt-2">
                {isCompleted
                  ? <><span aria-hidden="true">🎉 </span>{t('complete')}</>
                  : isRunning
                    ? t('running')
                    : t('ready')}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isCompleted && !isRunning && timeLeft === totalSeconds && (
              <Button
                onClick={handleStart}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold shadow-lg"
              >
                <Play className="h-5 w-5 mr-2" aria-hidden="true" />
                {t('startTimer')}
              </Button>
            )}

            {isRunning && (
              <Button
                onClick={handlePause}
                variant="outline"
                className="px-6 py-6 text-lg"
              >
                <Pause className="h-5 w-5 mr-2" aria-hidden="true" />
                {t('pause')}
              </Button>
            )}

            {!isCompleted && !isRunning && timeLeft < totalSeconds && (
              <>
                <Button
                  onClick={handleStart}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-6 text-lg"
                >
                  <Play className="h-5 w-5 mr-2" aria-hidden="true" />
                  {t('resume')}
                </Button>
              </>
            )}

            {isCompleted && (
              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold shadow-lg shadow-green-600/20 w-full"
                >
                  <Check className="h-5 w-5 mr-2" aria-hidden="true" />
                  {t('finishClaim')}
                </Button>

                {/* "Do More" feature - Extend time */}
                <Button
                  onClick={() => {
                    const extraMinutes = 5;
                    setAdjustedMinutes(prev => prev + extraMinutes);
                    setTimeLeft(extraMinutes * 60);
                    setIsCompleted(false);
                    setIsRunning(true);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('doMore', { minutes: 5, points: Math.round(5 * 1.5) })}
                </Button>
              </div>
            )}
          </div>

          {/* Cancel Button */}
          <div className="mt-6 text-center">
            <Button
              onClick={() => {
                if (!isCompleted && timeLeft < totalSeconds && onSave) {
                  onSave({ remainingSeconds: timeLeft, totalSeconds: adjustedMinutes * 60 });
                }
                onCancel();
              }}
              variant="ghost"
              className="text-gray-600 dark:text-gray-400"
            >
              {isCompleted ? t('close') : t('closeSaveProgress')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
