import Link from 'next/link';
import Image from 'next/image';
import { UserCircle, Heart, ArrowRight } from '@/components/ui/ClientIcons';
import BetaBadge from '@/components/BetaBadge';
import { getTranslations } from 'next-intl/server';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-background-light dark:bg-background-dark">
      <div className="text-center max-w-4xl">
        {/* Logo & Title */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Image src="/logo.png" alt="EarnQuest Logo" width={180} height={180} className="drop-shadow-lg -mr-2" />
            <div className="text-left">
              <div className="flex items-center gap-3">
                <h1 className="text-5xl md:text-6xl font-bold text-text-main dark:text-white font-display">
                  {t('app.name')}
                </h1>
                <BetaBadge />
              </div>
              <p className="text-xl md:text-2xl text-text-muted dark:text-text-muted mt-2">
                {t('app.tagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Parent Card */}
          <Link
            href={`/${locale}/login`}
            className="group relative overflow-hidden bg-white dark:bg-card-dark rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-10 hover:border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all duration-normal ease-out hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={t('landing.parentCard.description')}
          >
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center justify-center p-4 bg-primary/10 rounded-full">
                <UserCircle size={48} className="text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white mb-3">
                {t('landing.parentCard.title')}
              </h2>
              <p className="text-text-muted dark:text-text-muted mb-6">
                {t('landing.parentCard.description')}
              </p>
              <div className="inline-flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all">
                {t('landing.parentCard.cta')}
                <ArrowRight size={20} weight="bold" />
              </div>
            </div>
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-normal" />
          </Link>

          {/* Kid Card */}
          <Link
            href={`/${locale}/child-login`}
            className="group relative overflow-hidden bg-white dark:bg-card-dark rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-10 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-normal ease-out hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label={t('landing.kidCard.description')}
          >
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-full">
                <Heart size={48} className="text-blue-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white mb-3">
                {t('landing.kidCard.title')}
              </h2>
              <p className="text-text-muted dark:text-text-muted mb-6">
                {t('landing.kidCard.description')}
              </p>
              <div className="inline-flex items-center gap-2 text-blue-500 font-bold group-hover:gap-4 transition-all">
                {t('landing.kidCard.cta')}
                <ArrowRight size={20} weight="bold" />
              </div>
            </div>
            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-normal" />
          </Link>
        </div>

        {/* Footer text */}
        <p className="text-sm text-text-muted dark:text-text-muted">
          {t('landing.alreadyHaveAccount')}{' '}
          <Link
            href={`/${locale}/login`}
            className="text-primary hover:underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
          >
            {t('landing.signIn')}
          </Link>
        </p>
      </div>
    </main>
  );
}
