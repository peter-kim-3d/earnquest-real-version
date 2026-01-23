/**
 * Tests for lib/utils/milestones.ts
 *
 * Milestone Utilities (v2)
 */

import { describe, it, expect } from 'vitest';
import {
  MILESTONE_PERCENTAGES,
  DEFAULT_MILESTONE_BONUSES,
  getSuggestedMilestoneBonuses,
  checkMilestoneReached,
  getFirstMilestoneReached,
  getNextMilestone,
  getAllMilestones,
  calculateTotalMilestoneBonus,
  calculateNetPointsNeeded,
  hasMilestones,
  getProgressToNextMilestone,
} from '@/lib/utils/milestones';
import type { MilestoneBonuses } from '@/lib/types/goal';

describe('Milestone Constants', () => {
  it('should have correct milestone percentages', () => {
    expect(MILESTONE_PERCENTAGES).toEqual([25, 50, 75]);
  });

  it('should have empty default milestone bonuses', () => {
    expect(DEFAULT_MILESTONE_BONUSES).toEqual({});
  });
});

describe('getSuggestedMilestoneBonuses', () => {
  it('should calculate suggested bonuses based on target', () => {
    const bonuses = getSuggestedMilestoneBonuses(1000);
    expect(bonuses[25]).toBe(50); // 5% of 1000
    expect(bonuses[50]).toBe(75); // 1.5x of 50
    expect(bonuses[75]).toBe(100); // 2x of 50
  });

  it('should enforce minimum bonus values', () => {
    const bonuses = getSuggestedMilestoneBonuses(100);
    expect(bonuses[25]).toBe(10); // minimum 10
    expect(bonuses[50]).toBe(15); // minimum 15
    expect(bonuses[75]).toBe(20); // minimum 20
  });

  it('should scale with larger targets', () => {
    const bonuses = getSuggestedMilestoneBonuses(5000);
    expect(bonuses[25]).toBe(250);
    expect(bonuses[50]).toBe(375);
    expect(bonuses[75]).toBe(500);
  });
});

describe('checkMilestoneReached', () => {
  it('should return true when milestone is crossed', () => {
    expect(checkMilestoneReached(20, 30, 100, 25)).toBe(true);
    expect(checkMilestoneReached(40, 60, 100, 50)).toBe(true);
    expect(checkMilestoneReached(70, 80, 100, 75)).toBe(true);
  });

  it('should return false when milestone is not crossed', () => {
    expect(checkMilestoneReached(10, 20, 100, 25)).toBe(false);
    expect(checkMilestoneReached(30, 40, 100, 50)).toBe(false);
    expect(checkMilestoneReached(50, 60, 100, 75)).toBe(false);
  });

  it('should return false when milestone was already completed', () => {
    expect(checkMilestoneReached(20, 30, 100, 25, [25])).toBe(false);
    expect(checkMilestoneReached(40, 60, 100, 50, [50])).toBe(false);
  });

  it('should return false when target is zero or negative', () => {
    expect(checkMilestoneReached(20, 30, 0, 25)).toBe(false);
    expect(checkMilestoneReached(20, 30, -100, 25)).toBe(false);
  });

  it('should handle exact milestone crossing', () => {
    expect(checkMilestoneReached(24, 25, 100, 25)).toBe(true);
    expect(checkMilestoneReached(25, 26, 100, 25)).toBe(false); // already past
  });
});

describe('getFirstMilestoneReached', () => {
  const bonuses: MilestoneBonuses = { 25: 10, 50: 20, 75: 30 };

  it('should return first milestone crossed', () => {
    const result = getFirstMilestoneReached(20, 30, 100, bonuses);
    expect(result).toEqual({ percentage: 25, bonus: 10 });
  });

  it('should return 50% milestone when 25% already completed', () => {
    const result = getFirstMilestoneReached(40, 60, 100, bonuses, [25]);
    expect(result).toEqual({ percentage: 50, bonus: 20 });
  });

  it('should return null when no milestone crossed', () => {
    const result = getFirstMilestoneReached(10, 15, 100, bonuses);
    expect(result).toBeNull();
  });

  it('should return null when bonuses is null', () => {
    const result = getFirstMilestoneReached(20, 30, 100, null);
    expect(result).toBeNull();
  });

  it('should return null when target is zero', () => {
    const result = getFirstMilestoneReached(20, 30, 0, bonuses);
    expect(result).toBeNull();
  });

  it('should skip milestones with zero bonus', () => {
    const partialBonuses: MilestoneBonuses = { 25: 0, 50: 20 };
    const result = getFirstMilestoneReached(40, 60, 100, partialBonuses, []);
    expect(result).toEqual({ percentage: 50, bonus: 20 });
  });
});

describe('getNextMilestone', () => {
  const bonuses: MilestoneBonuses = { 25: 10, 50: 20, 75: 30 };

  it('should return 25% milestone when starting', () => {
    const result = getNextMilestone(0, 100, bonuses);
    expect(result).toEqual({
      percentage: 25,
      bonusPoints: 10,
      isCompleted: false,
      pointsRequired: 25,
    });
  });

  it('should return 50% milestone when 25% is passed', () => {
    const result = getNextMilestone(30, 100, bonuses);
    expect(result).toEqual({
      percentage: 50,
      bonusPoints: 20,
      isCompleted: false,
      pointsRequired: 50,
    });
  });

  it('should skip completed milestones', () => {
    const result = getNextMilestone(10, 100, bonuses, [25]);
    expect(result).toEqual({
      percentage: 50,
      bonusPoints: 20,
      isCompleted: false,
      pointsRequired: 50,
    });
  });

  it('should return null when all milestones completed', () => {
    const result = getNextMilestone(80, 100, bonuses, [25, 50, 75]);
    expect(result).toBeNull();
  });

  it('should return null when bonuses is null', () => {
    const result = getNextMilestone(10, 100, null);
    expect(result).toBeNull();
  });

  it('should return null when target is zero', () => {
    const result = getNextMilestone(10, 0, bonuses);
    expect(result).toBeNull();
  });
});

describe('getAllMilestones', () => {
  const bonuses: MilestoneBonuses = { 25: 10, 50: 20, 75: 30 };

  it('should return all milestones with status', () => {
    const result = getAllMilestones(100, 0, bonuses);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      percentage: 25,
      bonusPoints: 10,
      isCompleted: false,
      pointsRequired: 25,
    });
    expect(result[1]).toEqual({
      percentage: 50,
      bonusPoints: 20,
      isCompleted: false,
      pointsRequired: 50,
    });
    expect(result[2]).toEqual({
      percentage: 75,
      bonusPoints: 30,
      isCompleted: false,
      pointsRequired: 75,
    });
  });

  it('should mark completed milestones', () => {
    const result = getAllMilestones(100, 50, bonuses, [25]);
    expect(result[0].isCompleted).toBe(true);
    expect(result[1].isCompleted).toBe(false);
    expect(result[2].isCompleted).toBe(false);
  });

  it('should filter out milestones with zero bonus', () => {
    const partialBonuses: MilestoneBonuses = { 25: 10, 50: 0, 75: 30 };
    const result = getAllMilestones(100, 0, partialBonuses);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.percentage)).toEqual([25, 75]);
  });

  it('should return empty array for null bonuses', () => {
    const result = getAllMilestones(100, 0, null);
    expect(result).toEqual([]);
  });

  it('should return empty array for zero target', () => {
    const result = getAllMilestones(0, 0, bonuses);
    expect(result).toEqual([]);
  });
});

describe('calculateTotalMilestoneBonus', () => {
  it('should sum all milestone bonuses', () => {
    const bonuses: MilestoneBonuses = { 25: 10, 50: 20, 75: 30 };
    expect(calculateTotalMilestoneBonus(bonuses)).toBe(60);
  });

  it('should handle partial bonuses', () => {
    const bonuses: MilestoneBonuses = { 25: 10, 75: 30 };
    expect(calculateTotalMilestoneBonus(bonuses)).toBe(40);
  });

  it('should return 0 for null bonuses', () => {
    expect(calculateTotalMilestoneBonus(null)).toBe(0);
  });

  it('should return 0 for empty bonuses', () => {
    expect(calculateTotalMilestoneBonus({})).toBe(0);
  });
});

describe('calculateNetPointsNeeded', () => {
  it('should subtract total bonuses from target', () => {
    const bonuses: MilestoneBonuses = { 25: 10, 50: 20, 75: 30 };
    expect(calculateNetPointsNeeded(100, bonuses)).toBe(40); // 100 - 60
  });

  it('should return target for null bonuses', () => {
    expect(calculateNetPointsNeeded(100, null)).toBe(100);
  });

  it('should not go below zero', () => {
    const bigBonuses: MilestoneBonuses = { 25: 50, 50: 50, 75: 50 };
    expect(calculateNetPointsNeeded(100, bigBonuses)).toBe(0);
  });
});

describe('hasMilestones', () => {
  it('should return true when at least one bonus > 0', () => {
    expect(hasMilestones({ 25: 10 })).toBe(true);
    expect(hasMilestones({ 25: 0, 50: 10 })).toBe(true);
    expect(hasMilestones({ 25: 10, 50: 20, 75: 30 })).toBe(true);
  });

  it('should return false when all bonuses are 0', () => {
    expect(hasMilestones({ 25: 0, 50: 0, 75: 0 })).toBe(false);
  });

  it('should return false for null bonuses', () => {
    expect(hasMilestones(null)).toBe(false);
  });

  it('should return false for empty bonuses', () => {
    expect(hasMilestones({})).toBe(false);
  });
});

describe('getProgressToNextMilestone', () => {
  const bonuses: MilestoneBonuses = { 25: 10, 50: 20, 75: 30 };

  it('should return progress info for next milestone', () => {
    const result = getProgressToNextMilestone(10, 100, bonuses);
    expect(result).not.toBeNull();
    expect(result?.pointsToMilestone).toBe(15);
    expect(result?.percentComplete).toBe(40); // 10/25 * 100
    expect(result?.milestone.percentage).toBe(25);
  });

  it('should handle progress past first milestone', () => {
    const result = getProgressToNextMilestone(30, 100, bonuses);
    expect(result).not.toBeNull();
    expect(result?.pointsToMilestone).toBe(20);
    expect(result?.percentComplete).toBe(60); // 30/50 * 100
    expect(result?.milestone.percentage).toBe(50);
  });

  it('should return null when no next milestone', () => {
    const result = getProgressToNextMilestone(80, 100, bonuses, [25, 50, 75]);
    expect(result).toBeNull();
  });

  it('should return null for null bonuses', () => {
    const result = getProgressToNextMilestone(10, 100, null);
    expect(result).toBeNull();
  });

  it('should cap percentComplete at 100', () => {
    const result = getProgressToNextMilestone(24, 100, bonuses);
    expect(result).not.toBeNull();
    expect(result?.percentComplete).toBeLessThanOrEqual(100);
  });
});
