import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import InviteCoParent from '@/components/settings/InviteCoParent';
import DeviceConnection from '@/components/settings/DeviceConnection';
import ChildPinToggle from '@/components/settings/ChildPinToggle';
import BetaBadge from '@/components/BetaBadge';
import Link from 'next/link';
import { Users, Envelope as Mail, CaretRight, Shield, User, Smartphone, Lock } from '@/components/ui/ClientIcons';
import { getUser } from '@/lib/services/user';
import { CollapsibleSection } from '@/components/ui/collapsible-section';


export default async function SettingsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en-US/login');
  }

  // Get user profile and family info
  const userProfile = await getUser(user.id) as {
    family_id: string;
    full_name: string;
    created_at: string;
    role: string;
  } | null;

  if (!userProfile || !userProfile.family_id) {
    redirect('/en-US/onboarding/add-child');
  }

  // Get family members count
  const { count: membersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', userProfile.family_id);

  // Get pending invitations
  const { data: pendingInvitesData } = await supabase
    .from('family_invitations')
    .select('id, invited_email, created_at, expires_at')
    .eq('family_id', userProfile.family_id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  const pendingInvites = (pendingInvitesData as unknown as { id: string; invited_email: string; created_at: string; expires_at: string }[]) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">
        Settings
      </h1>
      <p className="text-text-muted dark:text-text-muted mb-8">
        Manage your family account and preferences
      </p>

      <div className="space-y-6">
        {/* Family Section */}
        <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-text-main dark:text-white">
              Family Management
            </h2>
          </div>

          <div className="space-y-4">
            {/* Children Settings */}
            <Link
              href="/en-US/settings/children"
              className="block p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-main dark:text-white mb-1">
                    Children
                  </h3>
                  <p className="text-sm text-text-muted dark:text-text-muted">
                    Manage your children&apos;s profiles and settings
                  </p>
                </div>
                <CaretRight size={20} className="text-gray-400" />
              </div>
            </Link>

            {/* Device Connection */}
            <CollapsibleSection
              id="device-access"
              title="Child Device Access"
              description="Share login codes with your children"
              icon={Smartphone}
            >
              <DeviceConnection />
            </CollapsibleSection>

            {/* Child PIN Security */}
            <CollapsibleSection
              id="child-pin"
              title="Child Login Security"
              description="Manage PIN requirements for child accounts"
              icon={Lock}
            >
              <ChildPinToggle />
            </CollapsibleSection>

            {/* Co-Parent Invite */}
            <CollapsibleSection
              title="Co-Parent Access"
              description={membersCount && membersCount > 1
                ? `${membersCount} parents have access`
                : 'Invite another parent'}
              icon={Mail}
            >
              <InviteCoParent />

              {/* Pending Invites */}
              {pendingInvites && pendingInvites.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-text-muted dark:text-text-muted mb-2 uppercase">
                    Pending Invitations
                  </p>
                  <div className="space-y-2">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800"
                      >
                        <span className="text-sm text-text-main dark:text-white">
                          {invite.invited_email}
                        </span>
                        <span className="text-xs text-text-muted dark:text-text-muted">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleSection>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-text-main dark:text-white">
              Account
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium text-text-muted dark:text-text-muted">
                Email
              </span>
              <span className="text-sm text-text-main dark:text-white">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium text-text-muted dark:text-text-muted">
                Name
              </span>
              <span className="text-sm text-text-main dark:text-white">
                {userProfile.full_name || 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {/* App Info Section */}
        <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-text-main dark:text-white">
              About EarnQuest
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium text-text-muted dark:text-text-muted">
                Version
              </span>
              <span className="text-sm font-mono text-text-main dark:text-white">
                v0.1.0 <BetaBadge size="sm" className="ml-1" />
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium text-text-muted dark:text-text-muted">
                Support
              </span>
              <a href="mailto:support@earnquest.app" className="text-sm text-primary hover:underline">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
