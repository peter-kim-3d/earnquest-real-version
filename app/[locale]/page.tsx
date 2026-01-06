import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('app');

  return (
    <div className="flex min-h-screen items-center justify-center bg-light">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-quest-purple">
          {t('name')}
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          {t('tagline')}
        </p>
      </div>
    </div>
  );
}
