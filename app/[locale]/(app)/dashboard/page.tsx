import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const t = useTranslations('nav');

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-dark">{t('dashboard')}</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No tasks yet</p>
            <p className="mt-2 text-xs text-gray-500">Task system coming in Week 5-6</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Points Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-star-gold">0</p>
            <p className="mt-2 text-xs text-gray-500">Points system coming in Week 5-6</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">0 tasks completed</p>
            <p className="mt-2 text-xs text-gray-500">Analytics coming in Week 7-8</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-quest-purple/5 rounded-lg border border-quest-purple/20">
        <h2 className="text-lg font-semibold text-quest-purple mb-2">
          Phase 1 Week 1-2: Foundation Complete! 🎉
        </h2>
        <p className="text-gray-700">
          The EarnQuest foundation is set up with i18n, brand design system, and auth structure.
          Coming next in Week 3-4: Authentication implementation and family setup.
        </p>
      </div>
    </div>
  );
}
