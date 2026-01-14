// Check if database tables exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// Use service role key to bypass RLS
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

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  const tables = [
    'families', 'users', 'children', 'tasks', 'task_completions',
    'rewards', 'reward_purchases', 'point_transactions',
    'kindness_cards', 'kindness_badges', 'family_values',
    'screen_usage_log', 'task_templates', 'reward_templates'
  ];

  let successCount = 0;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS (${count || 0} rows)`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${table}: ERROR - ${err.message}`);
    }
  }

  console.log(`\n📊 Summary: ${successCount}/${tables.length} tables found\n`);

  // Check views
  console.log('🔍 Checking database views...\n');
  const views = ['v_child_today_tasks', 'v_pending_approvals', 'v_weekly_screen_usage'];

  for (const view of views) {
    try {
      const { error } = await supabase
        .from(view)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`❌ ${view}: ${error.message}`);
      } else {
        console.log(`✅ ${view}: EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${view}: ERROR - ${err.message}`);
    }
  }

  console.log('\n✨ Database setup complete!\n');
}

checkTables().catch(console.error);
