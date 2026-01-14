'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';

interface TimerModalProps {
  taskName: string;
  timerMinutes: number;
  initialState?: { remainingSeconds: number; totalSeconds: number };
  isOpen: boolean;
  onComplete: () => void;
  onCancel: () => void;
  onSave?: (state: { remainingSeconds: number; totalSeconds: number }) => void;
}

export default function TimerModal({
  taskName,
  timerMinutes,
  initialState,
  isOpen,
  onComplete,
  onCancel,
  onSave,
}: TimerModalProps) {
  const [adjustedMinutes, setAdjustedMinutes] = useState(
    initialState ? Math.ceil(initialState.totalSeconds / 60) : timerMinutes
  );
  // If initialState exists, stick to it, otherwise default calculation
  const [timeLeft, setTimeLeft] = useState(
    initialState ? initialState.remainingSeconds : timerMinutes * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = adjustedMinutes * 60;
  // Fix progress calculation: if saved state exists, we need consistent total
  // Actually, let's trust adjustedMinutes derived from totalSeconds or passed in

  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
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
  }, [isRunning, timeLeft]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialState) {
        // Resume mode
        setAdjustedMinutes(Math.ceil(initialState.totalSeconds / 60));
        setTimeLeft(initialState.remainingSeconds);
        // Don't auto-start on resume, let user click Resume
      } else {
        // Fresh start
        setAdjustedMinutes(timerMinutes);
        setTimeLeft(timerMinutes * 60);
      }
      setIsRunning(false);
      setIsCompleted(false);
    }
  }, [isOpen, timerMinutes]); // Added initialState to deps only if deep checked, but here okay.

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    // Explicit save on pause
    if (onSave) {
      onSave({ remainingSeconds: timeLeft, totalSeconds: adjustedMinutes * 60 });
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(timerMinutes * 60);
    setAdjustedMinutes(timerMinutes); // Reset total too
    setIsCompleted(false);
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
              + {Math.max(5, Math.round(Math.round(timerMinutes * 1.5) / 5) * 5)} XP
            </span>
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* v2: Removed +/- buttons as per request. Duration is fixed to parent setting initially. */}

          {/* Circular Progress Timer */}
          <div className="relative w-48 h-48 mx-auto mb-8">
            <svg className="transform -rotate-90 w-48 h-48">
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
                  ? '🎉 Complete!'
                  : isRunning
                    ? 'Timer running...'
                    : 'Ready to start'}
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
                <Play className="h-5 w-5 mr-2" />
                Start Timer
              </Button>
            )}

            {isRunning && (
              <Button
                onClick={handlePause}
                variant="outline"
                className="px-6 py-6 text-lg"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            )}

            {!isCompleted && !isRunning && timeLeft < totalSeconds && (
              <>
                <Button
                  onClick={handleStart}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-6 text-lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
                {/* User asked for "midway stop... show as progress". 
                    This is effectively the 'Paused' state displayed here.
                    To fully "start again later" after closing, we would need backend persistence.
                    For MVP, keeping the modal open in background or re-opening reset is standard.
                    We'll stick to 'Pause' concept for now.
                */}
              </>
            )}

            {isCompleted && (
              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold shadow-lg shadow-green-600/20 w-full"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Finish & Claim Points
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
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Do 5 More Minutes (+ {Math.round(5 * 1.5)} XP)
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
              {isCompleted ? 'Close' : 'Close & Save Progress'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
