'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FamilyInfoStep } from './steps/FamilyInfoStep';
import { AddChildrenStep } from './steps/AddChildrenStep';
import { SelectTasksRewardsStep } from './steps/SelectTasksRewardsStep';

export type FamilyData = {
  name: string;
  timezone: string;
  language: string;
  autoApprovalHours: number;
  screenBudgetWeeklyMinutes: number;
};

export type ChildData = {
  name: string;
  ageGroup: string;
  avatar: string;
  pointsBalance: number;
};

export type TaskTemplate = {
  id: string;
  category: string;
  name: string;
  points: number;
  approvalType: string;
  icon: string;
};

export type RewardTemplate = {
  id: string;
  category: string;
  name: string;
  points: number;
  isScreenReward: boolean;
  screenMinutes: number | null;
  icon: string;
};

export type WizardData = {
  family: FamilyData;
  children: ChildData[];
  selectedTasks: string[];
  selectedRewards: string[];
};

type WizardStep = 'family' | 'children' | 'tasks-rewards' | 'complete';

export function FamilyCreationWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('family');
  const [wizardData, setWizardData] = useState<WizardData>({
    family: {
      name: '',
      timezone: 'America/New_York',
      language: 'en',
      autoApprovalHours: 24,
      screenBudgetWeeklyMinutes: 300,
    },
    children: [],
    selectedTasks: [],
    selectedRewards: [],
  });

  const updateFamilyData = (data: Partial<FamilyData>) => {
    setWizardData((prev) => ({
      ...prev,
      family: { ...prev.family, ...data },
    }));
  };

  const updateChildren = (children: ChildData[]) => {
    setWizardData((prev) => ({ ...prev, children }));
  };

  const updateTasksRewards = (tasks: string[], rewards: string[]) => {
    setWizardData((prev) => ({
      ...prev,
      selectedTasks: tasks,
      selectedRewards: rewards,
    }));
  };

  const handleNext = () => {
    if (currentStep === 'family') {
      setCurrentStep('children');
    } else if (currentStep === 'children') {
      setCurrentStep('tasks-rewards');
    } else if (currentStep === 'tasks-rewards') {
      setCurrentStep('complete');
    }
  };

  const handleBack = () => {
    if (currentStep === 'children') {
      setCurrentStep('family');
    } else if (currentStep === 'tasks-rewards') {
      setCurrentStep('children');
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'family':
        return 1;
      case 'children':
        return 2;
      case 'tasks-rewards':
        return 3;
      default:
        return 3;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quest-purple-light/20 to-star-gold-light/20 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <StepIndicator number={1} label="Family Info" active={currentStep === 'family'} completed={getStepNumber() > 1} />
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div
                className={`h-full bg-quest-purple transition-all duration-300 ${
                  getStepNumber() >= 2 ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <StepIndicator number={2} label="Add Children" active={currentStep === 'children'} completed={getStepNumber() > 2} />
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div
                className={`h-full bg-quest-purple transition-all duration-300 ${
                  getStepNumber() >= 3 ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <StepIndicator number={3} label="Tasks & Rewards" active={currentStep === 'tasks-rewards'} completed={false} />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 'family' && (
            <FamilyInfoStep data={wizardData.family} onUpdate={updateFamilyData} onNext={handleNext} />
          )}
          {currentStep === 'children' && (
            <AddChildrenStep data={wizardData.children} onUpdate={updateChildren} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'tasks-rewards' && (
            <SelectTasksRewardsStep
              selectedTasks={wizardData.selectedTasks}
              selectedRewards={wizardData.selectedRewards}
              onUpdate={updateTasksRewards}
              onBack={handleBack}
              wizardData={wizardData}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
          active
            ? 'bg-quest-purple text-white ring-4 ring-quest-purple/20'
            : completed
            ? 'bg-growth-green text-white'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {completed ? '✓' : number}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-quest-purple' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}
