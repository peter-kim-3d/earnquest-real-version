import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/navigation';

export default function SignupPage() {
  const t = useTranslations('auth');
  const tApp = useTranslations('app');

  return (
    <Card className="p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-quest-purple">{tApp('name')}</h1>
        <p className="mt-2 text-gray-600">{t('signup')}</p>
      </div>

      <div className="space-y-4">
        <Button className="w-full" variant="outline" disabled>
          {t('continueWithGoogle')}
        </Button>
        <Button className="w-full" variant="outline" disabled>
          {t('continueWithApple')}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('alreadyHaveAccount')}{' '}
        <Link href="/login" className="text-quest-purple hover:underline">
          {t('login')}
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-gray-500">
        OAuth implementation coming in Week 3-4
      </p>
    </Card>
  );
}
