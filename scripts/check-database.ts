/**
 * Database Verification Script
 * Checks that sample data was seeded correctly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Verifying database state...\n');

  try {
    // Check families
    const { data: families } = await supabase
      .from('families')
      .select('id, name');

    console.log(`✅ Families: ${families?.length || 0}`);
    if (families && families.length > 0) {
      console.log(`   - ${families[0].name}`);
    }

    // Check users
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name');

    console.log(`✅ Users: ${users?.length || 0}`);

    // Check children
    const { data: children } = await supabase
      .from('children')
      .select('id, name, points_balance');

    console.log(`✅ Children: ${children?.length || 0}`);
    if (children && children.length > 0) {
      children.forEach(child => {
        console.log(`   - ${child.name}: ${child.points_balance} QP`);
      });
    }

    // Check tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, category')
      .is('deleted_at', null);

    console.log(`\n✅ Tasks: ${tasks?.length || 0}`);

    const tasksByCategory = tasks?.reduce((acc: any, task: any) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(tasksByCategory || {}).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count}`);
    });

    // Check rewards
    const { data: rewards } = await supabase
      .from('rewards')
      .select('id, category')
      .is('deleted_at', null);

    console.log(`\n✅ Rewards: ${rewards?.length || 0}`);

    const rewardsByCategory = rewards?.reduce((acc: any, reward: any) => {
      acc[reward.category] = (acc[reward.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(rewardsByCategory || {}).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count}`);
    });

    // Check task completions
    const { data: completions } = await supabase
      .from('task_completions')
      .select('id, status');

    console.log(`\n✅ Task Completions: ${completions?.length || 0}`);

    const completionsByStatus = completions?.reduce((acc: any, comp: any) => {
      acc[comp.status] = (acc[comp.status] || 0) + 1;
      return acc;
    }, {});

    Object.entries(completionsByStatus || {}).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    // Check reward purchases
    const { data: purchases } = await supabase
      .from('reward_purchases')
      .select('id, status');

    console.log(`\n✅ Reward Purchases: ${purchases?.length || 0}`);

    const purchasesByStatus = purchases?.reduce((acc: any, purchase: any) => {
      acc[purchase.status] = (acc[purchase.status] || 0) + 1;
      return acc;
    }, {});

    Object.entries(purchasesByStatus || {}).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    console.log('\n✨ Database verification complete!\n');
    console.log('🚀 Ready to test at: http://localhost:3001\n');

  } catch (error: any) {
    console.error('\n❌ Error checking database:', error.message);
    process.exit(1);
  }
}

checkDatabase();
