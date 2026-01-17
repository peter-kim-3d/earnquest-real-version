'use client';

import { useTranslations } from 'next-intl';

export default function SkipToContent() {
  const t = useTranslations('common.accessibility');

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {t('skipToContent')}
    </a>
  );
}