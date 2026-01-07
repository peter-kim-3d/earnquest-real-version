'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import type { WizardData } from '../FamilyCreationWizard';

type Props = {
    data: WizardData;
};

export function ReadyStep({ data }: Props) {
    const router = useRouter();
    const childCount = data.children.length;
    const taskCount = data.selectedTasks.length;
    // const weeklyGoal = 500; // This could be calculated or dynamic

    useEffect(() => {
        // Launch confetti on mount
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const handleStart = () => {
        router.push('/en-US/dashboard');
    };

    return (
        <div className="text-center max-w-2xl mx-auto py-8">
            {/* Hero Illustration */}
            <div className="mb-8 inline-flex items-center justify-center p-6 bg-white rounded-full shadow-xl shadow-quest-purple/10 border-4 border-quest-purple/20 animate-bounce">
                <span className="material-symbols-outlined text-6xl text-quest-purple">emoji_events</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Ready! <span className="text-quest-purple">🎉</span>
            </h1>

            <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto">
                You&apos;re all set up! Your child&apos;s first tasks are waiting. Let&apos;s start building those good habits together.
            </p>

            {/* Status Card Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 mb-10 text-left shadow-lg max-w-md mx-auto">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Configuration Summary</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined">face</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500">Child Profiles</p>
                            <p className="font-semibold text-gray-900">{childCount} Children Added</p>
                        </div>
                        <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <span className="material-symbols-outlined">task_alt</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500">Daily Tasks</p>
                            <p className="font-semibold text-gray-900">{taskCount} Tasks Set</p>
                        </div>
                        <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                    </div>

                    {/* 
          <div className="w-full h-px bg-gray-100"></div>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <span className="material-symbols-outlined">stars</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Weekly Goal</p>
              <p className="font-semibold text-gray-900">{weeklyGoal} Points</p>
            </div>
            <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
          </div> 
          */}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <Button
                    onClick={handleStart}
                    size="lg"
                    className="w-full md:w-auto px-8 py-6 text-lg shadow-lg hover:shadow-quest-purple/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                    <span className="material-symbols-outlined mr-2">rocket_launch</span>
                    Start Now
                </Button>
                {/* 
        <button className="w-full md:w-auto px-8 py-4 bg-transparent border-2 border-gray-200 text-gray-600 font-semibold text-lg rounded-lg hover:bg-gray-50 transition-colors duration-200">
            Adjust Tasks/Rewards
        </button> 
        */}
            </div>

            <p className="mt-6 text-sm text-gray-400">
                Don&apos;t worry, you can change these settings anytime from the dashboard.
            </p>
        </div>
    );
}
