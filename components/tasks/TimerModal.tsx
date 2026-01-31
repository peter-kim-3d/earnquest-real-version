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
  onComplete: (bonusMinutes?: number) => void;
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

  // Core timer state
  const [adjustedMinutes, setAdjustedMinutes] = useState(timerMinutes);
  const [timeLeft, setTimeLeft] = useState(timerMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Refs for timer logic - using absolute end time for accuracy
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number>(0); // Absolute timestamp when timer should end
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSeconds = adjustedMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Sound functions
  const playBeepSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

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
  }, []);

  const playAlarmSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/timer-complete.mp3');
      }
      audioRef.current.play().catch(() => {
        playBeepSound();
      });
    } catch {
      playBeepSound();
    }
  }, [playBeepSound]);

  // Calculate remaining time from absolute end time
  const calculateTimeLeft = useCallback(() => {
    if (endTimeRef.current === 0) return timeLeft;
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    return remaining;
  }, [timeLeft]);

  // Handle timer completion
  const handleTimerEnd = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(true);
    setTimeLeft(0);
    endTimeRef.current = 0;
    playAlarmSound();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [playAlarmSound]);

  // Request Wake Lock
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock activated');
      }
    } catch (err) {
      console.log('Wake Lock failed:', err);
    }
  }, []);

  // Release Wake Lock
  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  // Wake Lock management
  useEffect(() => {
    if (isRunning && isOpen) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isRunning, isOpen, requestWakeLock, releaseWakeLock]);

  // Main timer effect - runs interval when timer is active
  useEffect(() => {
    if (!isRunning || !isOpen) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Timer is running - start interval
    const tick = () => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleTimerEnd();
      }
    };

    // Immediate tick to sync
    tick();

    // Set up interval
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isOpen, calculateTimeLeft, handleTimerEnd]);

  // Handle visibility change - recalculate when returning from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && endTimeRef.current > 0) {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);

        if (remaining <= 0) {
          handleTimerEnd();
        }
      }

      // Re-acquire wake lock when visible
      if (document.visibilityState === 'visible' && isRunning && isOpen) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, isOpen, calculateTimeLeft, handleTimerEnd, requestWakeLock]);

  // Handle page focus (for when visibility doesn't fire)
  useEffect(() => {
    const handleFocus = () => {
      if (isRunning && endTimeRef.current > 0) {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);

        if (remaining <= 0) {
          handleTimerEnd();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isRunning, calculateTimeLeft, handleTimerEnd]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      const hasValidInitialState = initialState &&
        initialState.remainingSeconds > 0 &&
        initialState.totalSeconds > 0;

      if (hasValidInitialState) {
        setAdjustedMinutes(Math.ceil(initialState.totalSeconds / 60));
        setTimeLeft(initialState.remainingSeconds);
      } else {
        setAdjustedMinutes(timerMinutes);
        setTimeLeft(timerMinutes * 60);
      }
      setIsRunning(false);
      setIsCompleted(false);
      endTimeRef.current = 0;
    }
  }, [isOpen, timerMinutes, initialState]);

  // Start timer
  const handleStart = () => {
    // Set absolute end time based on current timeLeft
    endTimeRef.current = Date.now() + (timeLeft * 1000);
    setIsRunning(true);
  };

  // Pause timer
  const handlePause = () => {
    // Calculate and save current remaining time
    const remaining = calculateTimeLeft();
    setTimeLeft(remaining);
    setIsRunning(false);
    endTimeRef.current = 0;

    if (onSave) {
      onSave({ remainingSeconds: remaining, totalSeconds: adjustedMinutes * 60 });
    }
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(timerMinutes * 60);
    setAdjustedMinutes(timerMinutes);
    setIsCompleted(false);
    endTimeRef.current = 0;

    if (onSave) {
      onSave({ remainingSeconds: timerMinutes * 60, totalSeconds: timerMinutes * 60 });
    }
  };

  // Complete task
  const handleComplete = () => {
    if (isCompleted) {
      const bonusMinutes = adjustedMinutes - timerMinutes;
      onComplete(bonusMinutes > 0 ? bonusMinutes : undefined);
    }
  };

  // Do More - add extra time
  const handleDoMore = () => {
    const extraMinutes = 5;
    const newAdjustedMinutes = adjustedMinutes + extraMinutes;
    const extraSeconds = extraMinutes * 60;

    setAdjustedMinutes(newAdjustedMinutes);
    setTimeLeft(extraSeconds);
    setIsCompleted(false);

    // Set new end time and start
    endTimeRef.current = Date.now() + (extraSeconds * 1000);
    setIsRunning(true);
  };

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (!isCompleted && isRunning) {
        // Save current state if timer is running
        const remaining = calculateTimeLeft();
        if (onSave && remaining > 0) {
          onSave({ remainingSeconds: remaining, totalSeconds: adjustedMinutes * 60 });
        }
      } else if (!isCompleted && timeLeft < totalSeconds && onSave) {
        onSave({ remainingSeconds: timeLeft, totalSeconds: adjustedMinutes * 60 });
      }
      onCancel();
    }
  };

  // Circular progress
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
              <circle
                cx="96"
                cy="96"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
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
              <Button
                onClick={handleStart}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-6 text-lg"
              >
                <Play className="h-5 w-5 mr-2" aria-hidden="true" />
                {t('resume')}
              </Button>
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

                <Button
                  onClick={handleDoMore}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('doMore', { minutes: 5, points: Math.round(5 * (points / timerMinutes)) })}
                </Button>
              </div>
            )}
          </div>

          {/* Cancel Button */}
          <div className="mt-6 text-center">
            <Button
              onClick={() => {
                if (!isCompleted && isRunning) {
                  const remaining = calculateTimeLeft();
                  if (onSave && remaining > 0) {
                    onSave({ remainingSeconds: remaining, totalSeconds: adjustedMinutes * 60 });
                  }
                } else if (!isCompleted && timeLeft < totalSeconds && onSave) {
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
