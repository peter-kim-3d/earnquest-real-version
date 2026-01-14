// Verify complete onboarding data for a user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function verifyOnboarding(email) {
  console.log(`\n🔍 Verifying onboarding for: ${email}\n`);

  // 1. Check user profile
  const { data: user } = await supabase
    .from('users')
    .select('*, families(*)')
    .eq('email', email)
    .single();

  if (!user) {
    console.log('❌ User not found\n');
    return;
  }

  console.log('✅ User Profile:');
  console.log(`   - Email: ${user.email}`);
  console.log(`   - Name: ${user.full_name || 'Not set'}`);
  console.log(`   - Family: ${user.families?.name || 'My Family'}\n`);

  // 2. Check children
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', user.family_id);

  console.log(`✅ Children: ${children?.length || 0}`);
  children?.forEach((child, i) => {
    console.log(`   ${i + 1}. ${child.name} (${child.age_group})`);
    console.log(`      - Points: ${child.points_balance}`);
    console.log(`      - Trust Level: ${child.trust_level}`);
  });
  console.log('');

  // 3. Check tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', user.family_id);

  const tasksByCategory = (tasks || []).reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});

  console.log(`✅ Tasks: ${tasks?.length || 0}`);
  Object.entries(tasksByCategory).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count}`);
  });
  console.log('');

  // 4. Check rewards
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .eq('family_id', user.family_id);

  const rewardsByCategory = (rewards || []).reduce((acc, reward) => {
    acc[reward.category] = (acc[reward.category] || 0) + 1;
    return acc;
  }, {});

  console.log(`✅ Rewards: ${rewards?.length || 0}`);
  Object.entries(rewardsByCategory).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count}`);
  });
  console.log('');

  // 5. Check family values
  const { data: values } = await supabase
    .from('family_values')
    .select('*')
    .eq('family_id', user.family_id);

  console.log(`✅ Family Values: ${values?.length || 0}`);
  values?.forEach((value, i) => {
    console.log(`   ${i + 1}. ${value.title}`);
  });
  console.log('');

  // Summary
  console.log('📊 Onboarding Summary:');
  console.log(`   - User: ${user ? '✅' : '❌'}`);
  console.log(`   - Family: ${user?.families ? '✅' : '❌'}`);
  console.log(`   - Children: ${(children?.length || 0) > 0 ? '✅' : '❌'}`);
  console.log(`   - Tasks: ${(tasks?.length || 0) > 0 ? '✅' : '❌'}`);
  console.log(`   - Rewards: ${(rewards?.length || 0) > 0 ? '✅' : '❌'}`);
  console.log(`   - Values: ${(values?.length || 0) > 0 ? '✅ (optional)' : '⚠️  (skipped)'}`);

  const isComplete = user && user.families && (children?.length || 0) > 0 && (tasks?.length || 0) > 0 && (rewards?.length || 0) > 0;
  console.log(`\n${isComplete ? '🎉' : '⚠️'} Onboarding Status: ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}\n`);
}

// Get email from command line or use default
const email = process.argv[2] || 'test.id.peter.k@gmail.com';
verifyOnboarding(email).catch(console.error);
