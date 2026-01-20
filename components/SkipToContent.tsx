'use client';

import { useTranslations } from 'next-intl';

export default function SkipToContent() {
  const t = useTranslations('common.accessibility');

  return (
    <a
      href="#main-content"
      className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:rounded-md focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {t('skipToContent')}
    </a>
  );
}