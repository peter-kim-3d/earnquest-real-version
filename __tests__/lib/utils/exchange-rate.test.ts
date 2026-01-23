/**
 * Tests for lib/utils/exchange-rate.ts
 *
 * Exchange Rate Utilities (v2)
 */

import { describe, it, expect } from 'vitest';
import {
  VALID_EXCHANGE_RATES,
  DEFAULT_EXCHANGE_RATE,
  EXCHANGE_RATE_OPTIONS,
  getExchangeRateLabel,
  calculatePointsFromDollars,
  calculateDollarValue,
  formatPointsAsDollars,
  formatCentsAsDollars,
  dollarsToCents,
  centsToDollars,
  calculateDaysNeeded,
  formatTimeEstimate,
  calculateTimeEstimate,
  isValidExchangeRate,
  type ExchangeRate,
} from '@/lib/utils/exchange-rate';

describe('Exchange Rate Constants', () => {
  it('should have valid exchange rates', () => {
    expect(VALID_EXCHANGE_RATES).toEqual([10, 20, 50, 100, 200]);
  });

  it('should have default exchange rate of 100', () => {
    expect(DEFAULT_EXCHANGE_RATE).toBe(100);
  });

  it('should have exchange rate options', () => {
    expect(EXCHANGE_RATE_OPTIONS).toHaveLength(5);
    expect(EXCHANGE_RATE_OPTIONS.map((o) => o.value)).toEqual([10, 20, 50, 100, 200]);
  });
});

describe('getExchangeRateLabel', () => {
  it('should return USD label for default locale', () => {
    expect(getExchangeRateLabel(100)).toBe('$1 = 100 XP');
    expect(getExchangeRateLabel(50)).toBe('$1 = 50 XP');
  });

  it('should return USD label for en-US locale', () => {
    expect(getExchangeRateLabel(100, 'en-US')).toBe('$1 = 100 XP');
    expect(getExchangeRateLabel(10, 'en-US')).toBe('$1 = 10 XP');
  });

  it('should return KRW label for Korean locale', () => {
    expect(getExchangeRateLabel(100, 'ko-KR')).toBe('₩1,000 = 100 XP');
    expect(getExchangeRateLabel(50, 'ko')).toBe('₩1,000 = 50 XP');
  });
});

describe('calculatePointsFromDollars', () => {
  it('should calculate points with default rate', () => {
    expect(calculatePointsFromDollars(1)).toBe(100);
    expect(calculatePointsFromDollars(5)).toBe(500);
    expect(calculatePointsFromDollars(10)).toBe(1000);
  });

  it('should calculate points with custom rate', () => {
    expect(calculatePointsFromDollars(1, 50)).toBe(50);
    expect(calculatePointsFromDollars(1, 200)).toBe(200);
    expect(calculatePointsFromDollars(2.5, 10)).toBe(25);
  });

  it('should round to nearest whole number', () => {
    expect(calculatePointsFromDollars(1.5, 100)).toBe(150);
    expect(calculatePointsFromDollars(1.33, 100)).toBe(133);
  });
});

describe('calculateDollarValue', () => {
  it('should calculate dollar value with default rate', () => {
    expect(calculateDollarValue(100)).toBe(1);
    expect(calculateDollarValue(500)).toBe(5);
    expect(calculateDollarValue(1000)).toBe(10);
  });

  it('should calculate dollar value with custom rate', () => {
    expect(calculateDollarValue(100, 50)).toBe(2);
    expect(calculateDollarValue(100, 200)).toBe(0.5);
    expect(calculateDollarValue(250, 10)).toBe(25);
  });
});

describe('formatPointsAsDollars', () => {
  it('should format for USD by default', () => {
    expect(formatPointsAsDollars(100)).toBe('$1.00');
    expect(formatPointsAsDollars(500)).toBe('$5.00');
    expect(formatPointsAsDollars(1050)).toBe('$10.50');
  });

  it('should format for USD with custom rate', () => {
    expect(formatPointsAsDollars(100, 50)).toBe('$2.00');
    expect(formatPointsAsDollars(100, 200)).toBe('$0.50');
  });

  it('should format for KRW locale', () => {
    const result = formatPointsAsDollars(100, 100, 'ko-KR');
    expect(result).toContain('₩');
    expect(result).toContain('1,000');
  });
});

describe('formatCentsAsDollars', () => {
  it('should format cents as dollars', () => {
    expect(formatCentsAsDollars(100)).toBe('$1.00');
    expect(formatCentsAsDollars(500)).toBe('$5.00');
    expect(formatCentsAsDollars(1050)).toBe('$10.50');
    expect(formatCentsAsDollars(99)).toBe('$0.99');
  });
});

describe('dollarsToCents', () => {
  it('should convert dollars to cents', () => {
    expect(dollarsToCents(1)).toBe(100);
    expect(dollarsToCents(5)).toBe(500);
    expect(dollarsToCents(10.50)).toBe(1050);
    expect(dollarsToCents(0.99)).toBe(99);
  });

  it('should round to nearest cent', () => {
    expect(dollarsToCents(1.999)).toBe(200);
    expect(dollarsToCents(1.001)).toBe(100);
  });
});

describe('centsToDollars', () => {
  it('should convert cents to dollars', () => {
    expect(centsToDollars(100)).toBe(1);
    expect(centsToDollars(500)).toBe(5);
    expect(centsToDollars(1050)).toBe(10.5);
    expect(centsToDollars(99)).toBe(0.99);
  });
});

describe('calculateDaysNeeded', () => {
  it('should calculate days with default values', () => {
    expect(calculateDaysNeeded(220)).toBe(1);
    expect(calculateDaysNeeded(440)).toBe(2);
    expect(calculateDaysNeeded(1100)).toBe(5);
  });

  it('should calculate days with current points', () => {
    expect(calculateDaysNeeded(220, 110)).toBe(1);
    expect(calculateDaysNeeded(440, 220)).toBe(1);
    expect(calculateDaysNeeded(1000, 800)).toBe(1);
  });

  it('should calculate days with custom daily average', () => {
    expect(calculateDaysNeeded(100, 0, 100)).toBe(1);
    expect(calculateDaysNeeded(200, 0, 100)).toBe(2);
    expect(calculateDaysNeeded(150, 0, 100)).toBe(2); // rounds up
  });

  it('should return Infinity for zero daily average', () => {
    expect(calculateDaysNeeded(100, 0, 0)).toBe(Infinity);
  });

  it('should return 0 when target is already reached', () => {
    expect(calculateDaysNeeded(100, 100)).toBe(0);
    expect(calculateDaysNeeded(100, 200)).toBe(0);
  });
});

describe('formatTimeEstimate', () => {
  it('should return "Ready now!" for 0 or negative days', () => {
    expect(formatTimeEstimate(0)).toBe('Ready now!');
    expect(formatTimeEstimate(-1)).toBe('Ready now!');
  });

  it('should return "1 day" for 1 day', () => {
    expect(formatTimeEstimate(1)).toBe('1 day');
  });

  it('should return day estimate for 2-6 days', () => {
    expect(formatTimeEstimate(2)).toBe('2 days');
    expect(formatTimeEstimate(5)).toBe('5 days');
    expect(formatTimeEstimate(6)).toBe('6 days');
  });

  it('should return "About 1 week" for 7-13 days', () => {
    expect(formatTimeEstimate(7)).toBe('About 1 week');
    expect(formatTimeEstimate(13)).toBe('About 1 week');
  });

  it('should return week estimate for 14-29 days', () => {
    expect(formatTimeEstimate(14)).toBe('About 2 weeks');
    expect(formatTimeEstimate(21)).toBe('About 3 weeks');
    expect(formatTimeEstimate(28)).toBe('About 4 weeks');
  });

  it('should return "About 1 month" for 30-59 days', () => {
    expect(formatTimeEstimate(30)).toBe('About 1 month');
    expect(formatTimeEstimate(59)).toBe('About 1 month');
  });

  it('should return month estimate for 60+ days', () => {
    expect(formatTimeEstimate(60)).toBe('About 2 months');
    expect(formatTimeEstimate(90)).toBe('About 3 months');
    expect(formatTimeEstimate(180)).toBe('About 6 months');
  });
});

describe('calculateTimeEstimate', () => {
  it('should combine calculateDaysNeeded and formatTimeEstimate', () => {
    expect(calculateTimeEstimate(220)).toBe('1 day');
    expect(calculateTimeEstimate(1540)).toBe('About 1 week');
    expect(calculateTimeEstimate(220, 0, 220)).toBe('1 day');
  });

  it('should return "Ready now!" when target reached', () => {
    expect(calculateTimeEstimate(100, 100)).toBe('Ready now!');
  });
});

describe('isValidExchangeRate', () => {
  it('should return true for valid exchange rates', () => {
    expect(isValidExchangeRate(10)).toBe(true);
    expect(isValidExchangeRate(20)).toBe(true);
    expect(isValidExchangeRate(50)).toBe(true);
    expect(isValidExchangeRate(100)).toBe(true);
    expect(isValidExchangeRate(200)).toBe(true);
  });

  it('should return false for invalid exchange rates', () => {
    expect(isValidExchangeRate(0)).toBe(false);
    expect(isValidExchangeRate(15)).toBe(false);
    expect(isValidExchangeRate(25)).toBe(false);
    expect(isValidExchangeRate(150)).toBe(false);
    expect(isValidExchangeRate(1000)).toBe(false);
  });
});
