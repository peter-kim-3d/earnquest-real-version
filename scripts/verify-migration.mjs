#!/usr/bin/env node

/**
 * Verify that the ticket redemption migration was applied successfully
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  console.log('\n🔍 Verifying Ticket Redemption Migration\n');
  console.log('='.repeat(60));

  let allPassed = true;

  // Check 1: used_at column exists
  console.log('\n📋 Checking schema changes...');
  const { data: withUsedAt, error: usedAtError } = await supabase
    .from('reward_purchases')
    .select('used_at')
    .limit(1);

  const usedAtExists = !usedAtError || !usedAtError.message?.includes('does not exist');
  console.log(usedAtExists ? '✅' : '❌', 'used_at column exists');
  if (!usedAtExists) {
    console.log('   Error:', usedAtError?.message);
    allPassed = false;
  }

  // Check 2: No old status values
  console.log('\n📋 Checking status migration...');
  const { data: oldStatuses } = await supabase
    .from('reward_purchases')
    .select('id, status')
    .in('status', ['purchased', 'fulfilled']);

  const noOldStatuses = oldStatuses?.length === 0;
  console.log(noOldStatuses ? '✅' : '❌', 'Old status values migrated');
  if (!noOldStatuses) {
    console.log(`   Found ${oldStatuses?.length} records with old status values`);
    oldStatuses?.forEach(r => {
      console.log(`   - ID: ${r.id.substring(0, 8)}... Status: ${r.status}`);
    });
    allPassed = false;
  }

  // Check 3: Database functions exist
  console.log('\n📋 Checking database functions...');

  const functions = [
    'request_ticket_use',
    'approve_ticket_use',
    'fulfill_ticket',
    'purchase_reward'
  ];

  for (const funcName of functions) {
    try {
      const { error } = await supabase.rpc(funcName, {
        p_purchase_id: '00000000-0000-0000-0000-000000000000',
        p_child_id: '00000000-0000-0000-0000-000000000000',
        p_parent_id: '00000000-0000-0000-0000-000000000000',
        p_reward_id: '00000000-0000-0000-0000-000000000000'
      });

      const exists = !error || !error.message?.includes('does not exist');
      console.log(exists ? '✅' : '❌', `${funcName}()`);
      if (!exists) {
        console.log('   Error:', error?.message);
        allPassed = false;
      }
    } catch (e) {
      console.log('❌', `${funcName}()`);
      console.log('   Error:', e.message);
      allPassed = false;
    }
  }

  // Check 4: Item category accepted
  console.log('\n📋 Checking category constraint...');
  const { data: itemRewards, error: itemError } = await supabase
    .from('rewards')
    .select('category')
    .eq('category', 'item')
    .limit(1);

  const itemCategoryExists = !itemError;
  console.log(itemCategoryExists ? '✅' : '❌', 'Item category accepted');
  if (!itemCategoryExists) {
    console.log('   Error:', itemError?.message);
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n✅ Migration successfully applied!\n');
    console.log('You can now test the ticket redemption system.\n');
    return 0;
  } else {
    console.log('\n❌ Migration NOT applied or incomplete.\n');
    console.log('Please apply the migration file:');
    console.log('  supabase/migrations/030_ticket_redemption_system.sql\n');
    console.log('Instructions:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Click "New Query"');
    console.log('3. Copy the entire contents of the migration file');
    console.log('4. Paste and run it');
    console.log('5. Run this script again to verify\n');
    return 1;
  }
}

verifyMigration()
  .then(code => process.exit(code))
  .catch(err => {
    console.error('❌ Verification error:', err);
    process.exit(1);
  });
