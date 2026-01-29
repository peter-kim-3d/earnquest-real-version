export const locales = ['en-US', 'ko-KR'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en-US';

/**
 * Type guard to check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export interface LocaleConfig {
  language: string;
  region: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  direction: 'ltr' | 'rtl';
}

export const localeConfigs: Record<Locale, LocaleConfig> = {
  'en-US': {
    language: 'en',
    region: 'US',
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStartsOn: 0, // Sunday
    direction: 'ltr',
  },
  'ko-KR': {
    language: 'ko',
    region: 'KR',
    currency: 'KRW',
    currencySymbol: '₩',
    dateFormat: 'YYYY.MM.DD',
    timeFormat: '24h',
    weekStartsOn: 1, // Monday
    direction: 'ltr',
  },
};
