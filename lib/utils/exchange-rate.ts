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
 * Exchange rate options with labels for settings UI
 */
export const EXCHANGE_RATE_OPTIONS = [
  { value: 10, label: '$1 = 10 XP', description: 'Lower effort per dollar' },
  { value: 20, label: '$1 = 20 XP', description: 'Low effort' },
  { value: 50, label: '$1 = 50 XP', description: 'Medium effort' },
  { value: 100, label: '$1 = 100 XP', description: 'Recommended' },
  { value: 200, label: '$1 = 200 XP', description: 'High effort per dollar' },
] as const;

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
 * Format points as dollar string
 * @param points - Point amount
 * @param rate - Exchange rate ($1 = X points)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted dollar string (e.g., "$5.00")
 */
export function formatPointsAsDollars(
  points: number,
  rate: ExchangeRate = DEFAULT_EXCHANGE_RATE,
  locale: string = 'en-US'
): string {
  const dollars = calculateDollarValue(points, rate);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
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
