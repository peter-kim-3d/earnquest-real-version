import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Settings, Users, Mail, Shield, Smartphone, LogOut } from 'lucide-react';
import Link from 'next/link';
import AvatarDisplay from '@/components/profile/AvatarDisplay';
import { getUser } from '@/lib/services/user';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }



  // ...

  // Get user profile
  const userProfile = await getUser(user.id);

  // Type assertion for userProfile
  const profile = userProfile as {
    full_name: string | null;
    family_id: string | null;
    role: string | null;
    created_at: string;
    avatar_url: string | null;
  } | null;

  // Get family info
  const { data: family } = await supabase
    .from('families')
    .select('name')
    .eq('id', profile?.family_id as string)
    .single();

  const familyData = family as { name: string } | null;

  // Get children count
  const { count: childrenCount } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', profile?.family_id as string);

  // Get co-parents count
  const { count: coParentsCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', profile?.family_id as string);

  const parentName = profile?.full_name || user.email?.split('@')[0] || 'Parent';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <AvatarDisplay
            avatarUrl={profile?.avatar_url || null}
            userName={parentName}
            size="lg"
            editable={true}
          />
        </div>
        <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">
          {parentName}
        </h1>
        <p className="text-text-muted dark:text-text-muted">
          {familyData?.name || 'Family'} • Parent Account
        </p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">
          Account Information
        </h2>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-text-muted dark:text-text-muted">
                Email
              </span>
            </div>
            <span className="text-sm text-text-main dark:text-white break-all">
              {user.email}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-text-muted dark:text-text-muted">
                Role
              </span>
            </div>
            <span className="text-sm text-text-main dark:text-white capitalize">
              {profile?.role || 'Parent'}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-text-muted dark:text-text-muted">
                Family Members
              </span>
            </div>
            <span className="text-sm text-text-main dark:text-white text-right">
              {coParentsCount || 0} Parent{(coParentsCount || 0) !== 1 ? 's' : ''} • {childrenCount || 0} Child{childrenCount !== 1 ? 'ren' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Settings */}
          <Link
            href={`/${locale}/settings`}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
            <div className="flex-1">
              <h3 className="font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">
                Settings
              </h3>
              <p className="text-sm text-text-muted dark:text-text-muted">
                Family preferences & settings
              </p>
            </div>
          </Link>

          {/* Manage Children */}
          <Link
            href={`/${locale}/settings/children`}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <Users className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
            <div className="flex-1">
              <h3 className="font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">
                Manage Children
              </h3>
              <p className="text-sm text-text-muted dark:text-text-muted">
                Edit profiles & settings
              </p>
            </div>
          </Link>

          {/* Child Device Access */}
          <Link
            href={`/${locale}/settings#device-access`}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <Smartphone className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
            <div className="flex-1">
              <h3 className="font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">
                Device Access
              </h3>
              <p className="text-sm text-text-muted dark:text-text-muted">
                Child login codes
              </p>
            </div>
          </Link>

          {/* Logout */}
          <form action="/api/auth/logout" method="POST" className="contents">
            <button
              type="submit"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group text-left"
            >
              <LogOut className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
              <div className="flex-1">
                <h3 className="font-semibold text-text-main dark:text-white group-hover:text-red-500 transition-colors">
                  Logout
                </h3>
                <p className="text-sm text-text-muted dark:text-text-muted">
                  Sign out of your account
                </p>
              </div>
            </button>
          </form>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-text-muted dark:text-text-muted text-center">
          Member since {new Date(profile?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
