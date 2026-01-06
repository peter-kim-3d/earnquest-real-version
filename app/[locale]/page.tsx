import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const t = useTranslations('app');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-6xl font-bold text-quest-purple mb-4">
          {t('name')}
        </h1>
        <p className="text-2xl text-gray-700 mb-8">
          {t('tagline')}
        </p>
        <p className="text-lg text-gray-600 mb-12">
          Motivate your kids with tasks, rewards, and a fun points system.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-quest-purple hover:bg-quest-purple/90 text-lg px-8 py-6">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
