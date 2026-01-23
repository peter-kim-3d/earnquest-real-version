/**
 * Tests for lib/format.ts
 *
 * Formatting utilities
 */

import { describe, it, expect } from 'vitest';
import { formatPoints, formatPercentage } from '@/lib/format';

describe('formatPoints', () => {
  it('should format whole numbers correctly', () => {
    expect(formatPoints(1000)).toBe('1,000');
    expect(formatPoints(100)).toBe('100');
    expect(formatPoints(0)).toBe('0');
    expect(formatPoints(1000000)).toBe('1,000,000');
  });

  it('should round decimal numbers', () => {
    expect(formatPoints(1000.5)).toBe('1,001');
    expect(formatPoints(999.4)).toBe('999');
    expect(formatPoints(1234.567)).toBe('1,235');
  });

  it('should handle null values', () => {
    expect(formatPoints(null)).toBe('0');
  });

  it('should handle undefined values', () => {
    expect(formatPoints(undefined)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatPoints(-100)).toBe('-100');
    expect(formatPoints(-1000)).toBe('-1,000');
  });

  it('should format large numbers with commas', () => {
    expect(formatPoints(10000)).toBe('10,000');
    expect(formatPoints(100000)).toBe('100,000');
    expect(formatPoints(9999999)).toBe('9,999,999');
  });
});

describe('formatPercentage', () => {
  it('should format percentage with default decimals', () => {
    expect(formatPercentage(50)).toBe('50%');
    expect(formatPercentage(100)).toBe('100%');
    expect(formatPercentage(0)).toBe('0%');
  });

  it('should format percentage with specified decimals', () => {
    expect(formatPercentage(50.5, 1)).toBe('50.5%');
    expect(formatPercentage(33.333, 2)).toBe('33.33%');
    expect(formatPercentage(66.6666, 3)).toBe('66.667%');
  });

  it('should handle zero decimals', () => {
    expect(formatPercentage(50.9, 0)).toBe('51%');
    expect(formatPercentage(50.4, 0)).toBe('50%');
  });

  it('should handle very small percentages', () => {
    expect(formatPercentage(0.1, 1)).toBe('0.1%');
    expect(formatPercentage(0.01, 2)).toBe('0.01%');
  });

  it('should handle percentages over 100', () => {
    expect(formatPercentage(150)).toBe('150%');
    expect(formatPercentage(200.5, 1)).toBe('200.5%');
  });

  it('should handle negative percentages', () => {
    expect(formatPercentage(-10)).toBe('-10%');
    expect(formatPercentage(-25.5, 1)).toBe('-25.5%');
  });
});
