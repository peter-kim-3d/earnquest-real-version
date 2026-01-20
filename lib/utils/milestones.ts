/**
 * Milestone Utilities (v2)
 *
 * Utilities for handling goal milestones and bonus calculations.
 */

import { MilestoneBonuses, MilestoneInfo } from '@/lib/types/goal';

/**
 * Available milestone percentages
 */
export const MILESTONE_PERCENTAGES = [25, 50, 75] as const;
export type MilestonePercentage = (typeof MILESTONE_PERCENTAGES)[number];

/**
 * Default milestone bonuses (empty - no bonuses by default)
 */
export const DEFAULT_MILESTONE_BONUSES: MilestoneBonuses = {};

/**
 * Suggested milestone bonus amounts based on goal target
 */
export function getSuggestedMilestoneBonuses(targetPoints: number): MilestoneBonuses {
  // Suggest 5% of remaining target as bonus at each milestone
  const baseBonus = Math.round(targetPoints * 0.05);
  return {
    25: Math.max(10, baseBonus),
    50: Math.max(15, Math.round(baseBonus * 1.5)),
    75: Math.max(20, Math.round(baseBonus * 2)),
  };
}

/**
 * Check if a milestone was reached with a new deposit
 * @param oldPoints - Points before deposit
 * @param newPoints - Points after deposit
 * @param targetPoints - Goal target points
 * @param milestonePct - Milestone percentage to check (25, 50, or 75)
 * @param completedMilestones - Array of already completed milestone percentages
 * @returns True if milestone was just reached
 */
export function checkMilestoneReached(
  oldPoints: number,
  newPoints: number,
  targetPoints: number,
  milestonePct: MilestonePercentage,
  completedMilestones: number[] = []
): boolean {
  if (targetPoints <= 0) return false;
  if (completedMilestones.includes(milestonePct)) return false;

  const oldProgress = (oldPoints / targetPoints) * 100;
  const newProgress = (newPoints / targetPoints) * 100;

  return oldProgress < milestonePct && newProgress >= milestonePct;
}

/**
 * Get the first milestone that would be crossed with a deposit
 * @param oldPoints - Points before deposit
 * @param newPoints - Points after deposit
 * @param targetPoints - Goal target points
 * @param milestoneBonuses - Configured milestone bonuses
 * @param completedMilestones - Array of already completed milestone percentages
 * @returns Milestone info if one was reached, null otherwise
 */
export function getFirstMilestoneReached(
  oldPoints: number,
  newPoints: number,
  targetPoints: number,
  milestoneBonuses: MilestoneBonuses | null,
  completedMilestones: number[] = []
): { percentage: MilestonePercentage; bonus: number } | null {
  if (!milestoneBonuses || targetPoints <= 0) return null;

  for (const pct of MILESTONE_PERCENTAGES) {
    if (checkMilestoneReached(oldPoints, newPoints, targetPoints, pct, completedMilestones)) {
      const bonus = milestoneBonuses[pct];
      if (bonus && bonus > 0) {
        return { percentage: pct, bonus };
      }
    }
  }

  return null;
}

/**
 * Get the next upcoming milestone
 * @param currentPoints - Current progress points
 * @param targetPoints - Goal target points
 * @param milestoneBonuses - Configured milestone bonuses
 * @param completedMilestones - Array of already completed milestone percentages
 * @returns Next milestone info or null if none remaining
 */
export function getNextMilestone(
  currentPoints: number,
  targetPoints: number,
  milestoneBonuses: MilestoneBonuses | null,
  completedMilestones: number[] = []
): MilestoneInfo | null {
  if (!milestoneBonuses || targetPoints <= 0) return null;

  const currentProgress = (currentPoints / targetPoints) * 100;

  for (const pct of MILESTONE_PERCENTAGES) {
    if (completedMilestones.includes(pct)) continue;
    if (currentProgress >= pct) continue;

    const bonus = milestoneBonuses[pct];
    if (bonus && bonus > 0) {
      return {
        percentage: pct,
        bonusPoints: bonus,
        isCompleted: false,
        pointsRequired: Math.ceil((targetPoints * pct) / 100),
      };
    }
  }

  return null;
}

/**
 * Get all milestones for a goal with their status
 * @param targetPoints - Goal target points
 * @param currentPoints - Current progress points
 * @param milestoneBonuses - Configured milestone bonuses
 * @param completedMilestones - Array of already completed milestone percentages
 * @returns Array of milestone info
 */
export function getAllMilestones(
  targetPoints: number,
  currentPoints: number,
  milestoneBonuses: MilestoneBonuses | null,
  completedMilestones: number[] = []
): MilestoneInfo[] {
  if (!milestoneBonuses || targetPoints <= 0) return [];

  return MILESTONE_PERCENTAGES.filter((pct) => {
    const bonus = milestoneBonuses[pct];
    return bonus && bonus > 0;
  }).map((pct) => {
    const pointsRequired = Math.ceil((targetPoints * pct) / 100);
    const isCompleted = completedMilestones.includes(pct);

    return {
      percentage: pct,
      bonusPoints: milestoneBonuses[pct]!,
      isCompleted,
      pointsRequired,
    };
  });
}

/**
 * Calculate total bonus points from all milestones
 * @param milestoneBonuses - Configured milestone bonuses
 * @returns Total bonus points available
 */
export function calculateTotalMilestoneBonus(milestoneBonuses: MilestoneBonuses | null): number {
  if (!milestoneBonuses) return 0;

  return MILESTONE_PERCENTAGES.reduce((total, pct) => {
    const bonus = milestoneBonuses[pct];
    return total + (bonus || 0);
  }, 0);
}

/**
 * Calculate points needed to reach goal (excluding bonuses)
 * @param targetPoints - Goal target points
 * @param milestoneBonuses - Configured milestone bonuses
 * @returns Net points child needs to save (target minus bonuses)
 */
export function calculateNetPointsNeeded(
  targetPoints: number,
  milestoneBonuses: MilestoneBonuses | null
): number {
  const totalBonus = calculateTotalMilestoneBonus(milestoneBonuses);
  return Math.max(0, targetPoints - totalBonus);
}

/**
 * Check if a goal has any milestones configured
 * @param milestoneBonuses - Configured milestone bonuses
 * @returns True if at least one milestone has a bonus > 0
 */
export function hasMilestones(milestoneBonuses: MilestoneBonuses | null): boolean {
  if (!milestoneBonuses) return false;

  return MILESTONE_PERCENTAGES.some((pct) => {
    const bonus = milestoneBonuses[pct];
    return bonus && bonus > 0;
  });
}

/**
 * Calculate progress to next milestone
 * @param currentPoints - Current progress points
 * @param targetPoints - Goal target points
 * @param milestoneBonuses - Configured milestone bonuses
 * @param completedMilestones - Array of already completed milestone percentages
 * @returns Object with progress info or null if no next milestone
 */
export function getProgressToNextMilestone(
  currentPoints: number,
  targetPoints: number,
  milestoneBonuses: MilestoneBonuses | null,
  completedMilestones: number[] = []
): { pointsToMilestone: number; percentComplete: number; milestone: MilestoneInfo } | null {
  const nextMilestone = getNextMilestone(
    currentPoints,
    targetPoints,
    milestoneBonuses,
    completedMilestones
  );

  if (!nextMilestone) return null;

  const pointsToMilestone = Math.max(0, nextMilestone.pointsRequired - currentPoints);
  const percentComplete = Math.min(
    100,
    (currentPoints / nextMilestone.pointsRequired) * 100
  );

  return {
    pointsToMilestone,
    percentComplete,
    milestone: nextMilestone,
  };
}
