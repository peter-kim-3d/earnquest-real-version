import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AvailableRewards } from '@/components/store/AvailableRewards';
import { MyPurchases } from '@/components/store/MyPurchases';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function RewardStorePage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en-US/login');
  }

  // Get user's family
  const { data: userData } = await supabase
    .from('users')
    .select('family_id, role')
    .eq('id', user.id)
    .single();

  if (!userData?.family_id) {
    redirect('/en-US/onboarding');
  }

  // Get children for the family
  const { data: familyChildren } = await supabase
    .from('children')
    .select('id, name, avatar_url, points_balance')
    .eq('family_id', userData.family_id)
    .is('deleted_at', null)
    .order('name');

  // Get available rewards for the family
  const { data: rewards } = await supabase
    .from('rewards')
    .select(`
      *,
      template:reward_templates(name_default, icon, description_default)
    `)
    .eq('family_id', userData.family_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('category')
    .order('points_cost');

  // Get recent purchases for all family children
  const { data: purchases } = await supabase
    .from('reward_purchases')
    .select(`
      *,
      child:children(name, avatar_url),
      reward:rewards(name, points_cost, category)
    `)
    .eq('family_id', userData.family_id)
    .order('purchased_at', { ascending: false })
    .limit(20);

  const totalPoints = familyChildren?.reduce((sum, child) => sum + (child.points_balance || 0), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reward Store</h1>
          <p className="text-gray-600">Spend your points on awesome rewards!</p>
        </div>

        {/* Family Points Summary */}
        <Card className="p-4 bg-gradient-to-br from-star-gold/20 to-star-gold/5 border-star-gold/30">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">⭐</span>
              <span className="text-3xl font-bold text-star-gold">{totalPoints}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Family Points</p>
          </div>
        </Card>
      </div>

      {/* Children Points Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {familyChildren?.map((child) => (
          <Card key={child.id} className="p-3 text-center">
            <div className="text-3xl mb-1">{child.avatar_url || '👤'}</div>
            <p className="font-semibold text-gray-900 text-sm mb-1">{child.name}</p>
            <Badge variant="secondary" className="bg-star-gold/20 text-star-gold">
              ⭐ {child.points_balance}
            </Badge>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="browse">Browse Rewards</TabsTrigger>
          <TabsTrigger value="purchases">My Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <AvailableRewards rewards={rewards || []} familyChildren={familyChildren || []} />
        </TabsContent>

        <TabsContent value="purchases">
          <MyPurchases purchases={purchases || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
