/**
 * Exchange Rate Utilities (v2)
 *
 * Utilities for converting between points and dollar values.
 * Dollar values are for parent reference only - never shown to children.
 */

/**
 * Valid exchange rates: $1 = X points
 */
export const VALID_EXCHANGE_RATES = [10, 20, 50, 100, 200] as const;
export type ExchangeRate = (typeof VALID_EXCHANGE_RATES)[number];

/**
 * Default exchange rate: $1 = 100 points
 */
export const DEFAULT_EXCHANGE_RATE: ExchangeRate = 100;

/**
 * Exchange rate option values
 */
export const EXCHANGE_RATE_OPTIONS = [
  { value: 10 as ExchangeRate },
  { value: 20 as ExchangeRate },
  { value: 50 as ExchangeRate },
  { value: 100 as ExchangeRate },
  { value: 200 as ExchangeRate },
] as const;

/**
 * Get locale-specific currency label for exchange rate
 * @param rate - Exchange rate value
 * @param locale - Locale string (e.g., 'en-US', 'ko-KR')
 * @returns Label string (e.g., "$1 = 10 XP" or "₩1,000 = 10 XP")
 */
export function getExchangeRateLabel(rate: ExchangeRate, locale: string = 'en-US'): string {
  if (locale.startsWith('ko')) {
    return `₩1,000 = ${rate} XP`;
  }
  return `$1 = ${rate} XP`;
}

/**
 * Calculate points from dollar amount
 * @param dollars - Dollar amount
 * @param rate - Exchange rate ($1 = X points)
 * @returns Points equivalent
 */
export function calculatePointsFromDollars(dollars: number, rate: ExchangeRate = DEFAULT_EXCHANGE_RATE): number {
  return Math.round(dollars * rate);
}

/**
 * Calculate dollar value from points
 * @param points - Point amount
 * @param rate - Exchange rate ($1 = X points)
 * @returns Dollar value
 */
export function calculateDollarValue(points: number, rate: ExchangeRate = DEFAULT_EXCHANGE_RATE): number {
  return points / rate;
}

/**
 * Format points as currency string (locale-aware)
 * @param points - Point amount
 * @param rate - Exchange rate ($1 or ₩1000 = X points)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted currency string (e.g., "$5.00" or "₩5,000")
 */
export function formatPointsAsDollars(
  points: number,
  rate: ExchangeRate = DEFAULT_EXCHANGE_RATE,
  locale: string = 'en-US'
): string {
  const value = calculateDollarValue(points, rate);

  if (locale.startsWith('ko')) {
    // For Korean: ₩1,000 = X points, so multiply by 1000
    const won = value * 1000;
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(won);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format cents as dollar string
 * @param cents - Amount in cents
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted dollar string (e.g., "$5.00")
 */
export function formatCentsAsDollars(cents: number, locale: string = 'en-US'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Convert dollars to cents
 * @param dollars - Dollar amount
 * @returns Cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param cents - Cents amount
 * @returns Dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Calculate days needed to reach a point goal
 * @param targetPoints - Target point amount
 * @param currentPoints - Current point amount (default: 0)
 * @param dailyAverage - Average daily point earnings (default: 220)
 * @returns Estimated days to reach goal
 */
export function calculateDaysNeeded(
  targetPoints: number,
  currentPoints: number = 0,
  dailyAverage: number = 220
): number {
  if (dailyAverage <= 0) return Infinity;
  const remaining = Math.max(targetPoints - currentPoints, 0);
  return Math.ceil(remaining / dailyAverage);
}

/**
 * Format time estimate in human-readable form
 * @param days - Number of days
 * @returns Human-readable time estimate
 */
export function formatTimeEstimate(days: number): string {
  if (days <= 0) return 'Ready now!';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 14) return 'About 1 week';
  if (days < 30) return `About ${Math.round(days / 7)} weeks`;
  if (days < 60) return 'About 1 month';
  return `About ${Math.round(days / 30)} months`;
}

/**
 * Calculate and format the time estimate for reaching a goal
 * @param targetPoints - Target point amount
 * @param currentPoints - Current point amount
 * @param dailyAverage - Average daily point earnings
 * @returns Human-readable time estimate
 */
export function calculateTimeEstimate(
  targetPoints: number,
  currentPoints: number = 0,
  dailyAverage: number = 220
): string {
  const days = calculateDaysNeeded(targetPoints, currentPoints, dailyAverage);
  return formatTimeEstimate(days);
}

/**
 * Check if an exchange rate is valid
 * @param rate - Rate to check
 * @returns True if valid
 */
export function isValidExchangeRate(rate: number): rate is ExchangeRate {
  return VALID_EXCHANGE_RATES.includes(rate as ExchangeRate);
}
