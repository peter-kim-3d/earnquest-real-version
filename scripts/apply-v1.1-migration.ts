/**
 * Apply V1.1 Migration Script
 * Applies the combined V1.1 migration to create goals, screen_time_budgets, etc.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying V1.1 Migration...\n');

  // Read the migration SQL file
  const migrationPath = resolve(process.cwd(), 'supabase/migrations/APPLY_V1.1_COMBINED.sql');

  try {
    const sql = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements (rough split - handles most cases)
    // We need to execute statements one by one due to Supabase limitations

    console.log('📄 Migration file loaded\n');

    // Execute the migration using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try alternative approach
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        console.log('⚠️  Cannot execute raw SQL via RPC.');
        console.log('   Please run the migration manually:\n');
        console.log('   Option 1: Supabase Dashboard');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to SQL Editor');
        console.log('   4. Paste contents of: supabase/migrations/APPLY_V1.1_COMBINED.sql');
        console.log('   5. Click Run\n');
        console.log('   Option 2: Supabase CLI');
        console.log('   npx supabase login');
        console.log('   npx supabase link --project-ref <your-project-ref>');
        console.log('   npx supabase db push\n');
        return;
      }
      throw error;
    }

    console.log('✅ Migration applied successfully!');

  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'ENOENT') {
      console.error('❌ Migration file not found:', migrationPath);
    } else {
      console.error('❌ Migration failed:', err.message || String(error));
    }

    // Try to apply key parts individually
    console.log('\n🔄 Attempting to apply migration parts individually...\n');

    await applyIndividualStatements();
  }
}

async function applyIndividualStatements() {
  // Try to create the main tables using direct inserts/queries

  // 1. Check if goals table exists
  const { error: goalsCheck } = await supabase.from('goals').select('id').limit(1);

  if (goalsCheck?.message?.includes('does not exist')) {
    console.log('⚠️  Goals table does not exist.');
    console.log('   The migration must be applied via SQL Editor or CLI.\n');

    // Print summary of what needs to be created
    console.log('📋 Tables to be created:');
    console.log('   - screen_time_budgets (Screen time budget tracking)');
    console.log('   - goals (Savings goals)');
    console.log('   - goal_deposits (Goal deposit history)');
    console.log('\n📋 Columns to be added:');
    console.log('   - tasks.screen_bonus_minutes');
    console.log('   - rewards.tier');
    console.log('   - rewards.approval_type');
    console.log('   - reward_purchases.auto_refund_at');
    console.log('\n📋 Functions to be created:');
    console.log('   - get_week_start_date()');
    console.log('   - get_or_create_screen_budget()');
    console.log('   - deposit_to_goal()');
    console.log('   - process_expired_approvals()');
    console.log('   - request_ticket_use() (updated)');
    console.log('   - approve_ticket_use() (updated)');
  } else {
    console.log('✅ Goals table already exists');
  }

  // 2. Check screen_time_budgets
  const { error: screenCheck } = await supabase.from('screen_time_budgets').select('id').limit(1);

  if (screenCheck?.message?.includes('does not exist')) {
    console.log('⚠️  screen_time_budgets table does not exist');
  } else {
    console.log('✅ screen_time_budgets table exists');
  }
}

applyMigration();
