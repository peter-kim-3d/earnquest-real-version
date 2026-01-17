import { getRequestConfig } from 'next-intl/server';
import { locales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as any)) {
    locale = 'en-US';
  }

  // Load all namespaces and merge them
  const [common, auth, onboarding, parent, child, tasks, rewards, settings, goals, kindness] = await Promise.all([
    import(`@/locales/${locale}/common.json`),
    import(`@/locales/${locale}/auth.json`),
    import(`@/locales/${locale}/onboarding.json`),
    import(`@/locales/${locale}/parent.json`),
    import(`@/locales/${locale}/child.json`),
    import(`@/locales/${locale}/tasks.json`),
    import(`@/locales/${locale}/rewards.json`),
    import(`@/locales/${locale}/settings.json`),
    import(`@/locales/${locale}/goals.json`),
    import(`@/locales/${locale}/kindness.json`),
  ]);

  return {
    locale,
    messages: {
      common: common.default,
      auth: auth.default,
      onboarding: onboarding.default,
      parent: parent.default,
      child: child.default,
      tasks: tasks.default,
      rewards: rewards.default,
      settings: settings.default,
      goals: goals.default,
      kindness: kindness.default,
    },
  };
});
