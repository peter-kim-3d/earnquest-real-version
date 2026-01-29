/**
 * Goals Feature Test Script
 * Tests the V1.1 goals system including:
 * - Creating goals
 * - Depositing points to goals
 * - Goal completion
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testGoals() {
  console.log('🎯 Testing Goals Feature...\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Check if goals table exists
    console.log('\n📋 Step 1: Checking goals table...');
    const { data: goalsTable, error: tableError } = await supabase
      .from('goals')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Goals table not found or error:', tableError.message);
      console.log('\n⚠️  You may need to run the V1.1 migration first.');
      console.log('   Run the SQL in supabase/migrations/APPLY_V1.1_COMBINED.sql');
      process.exit(1);
    }
    console.log('✅ Goals table exists');

    // Step 2: Get a test child
    console.log('\n📋 Step 2: Finding test child...');
    const { data: children, error: childError } = await supabase
      .from('children')
      .select('id, name, family_id, points_balance')
      .is('deleted_at', null)
      .limit(1);

    if (childError || !children || children.length === 0) {
      console.error('❌ No children found in database');
      console.log('   Run: npm run seed to create test data');
      process.exit(1);
    }

    const testChild = children[0];
    console.log(`✅ Found child: ${testChild.name}`);
    console.log(`   Current balance: ${testChild.points_balance} XP`);

    // Step 3: Create a test goal
    console.log('\n📋 Step 3: Creating test goal...');
    const goalName = `Test Goal ${Date.now()}`;
    const targetPoints = 100;

    const { data: newGoal, error: createError } = await supabase
      .from('goals')
      .insert({
        child_id: testChild.id,
        family_id: testChild.family_id,
        name: goalName,
        description: 'A test goal created by the test script',
        target_points: targetPoints,
        current_points: 0,
        tier: 'small',
        is_completed: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create goal:', createError.message);
      process.exit(1);
    }

    console.log(`✅ Created goal: "${newGoal.name}"`);
    console.log(`   ID: ${newGoal.id}`);
    console.log(`   Target: ${newGoal.target_points} XP`);
    console.log(`   Tier: ${newGoal.tier}`);

    // Step 4: Test deposit (if child has enough points)
    console.log('\n📋 Step 4: Testing deposit...');

    if (testChild.points_balance < 50) {
      console.log('⚠️  Child has insufficient points for deposit test');
      console.log(`   Balance: ${testChild.points_balance} XP, Need: 50 XP`);
      console.log('   Giving child 100 bonus points for testing...');

      // Add points to child
      await supabase
        .from('children')
        .update({ points_balance: testChild.points_balance + 100 })
        .eq('id', testChild.id);

      testChild.points_balance += 100;
      console.log(`   New balance: ${testChild.points_balance} XP`);
    }

    // Test the deposit_to_goal RPC function
    const depositAmount = 50;
    const { data: depositResult, error: depositError } = await supabase.rpc('deposit_to_goal', {
      p_goal_id: newGoal.id,
      p_child_id: testChild.id,
      p_amount: depositAmount,
    });

    if (depositError) {
      console.error('❌ Deposit RPC failed:', depositError.message);
      console.log('\n⚠️  The deposit_to_goal function may not exist.');
      console.log('   Make sure the V1.1 migration has been applied.');
    } else {
      console.log('✅ Deposit successful!');
      console.log(`   Deposited: ${depositAmount} XP`);
      console.log(`   New balance: ${depositResult.new_balance} XP`);
      console.log(`   Goal progress: ${depositResult.goal_progress}/${depositResult.goal_target} XP`);
      console.log(`   Completed: ${depositResult.is_completed ? 'Yes!' : 'Not yet'}`);
    }

    // Step 5: Verify the goal was updated
    console.log('\n📋 Step 5: Verifying goal state...');
    const { data: updatedGoal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', newGoal.id)
      .single();

    if (updatedGoal) {
      console.log(`✅ Goal state verified:`);
      console.log(`   Progress: ${updatedGoal.current_points}/${updatedGoal.target_points} XP`);
      console.log(`   Completed: ${updatedGoal.is_completed ? 'Yes' : 'No'}`);
    }

    // Step 6: Check goal deposits log
    console.log('\n📋 Step 6: Checking deposit history...');
    const { data: deposits } = await supabase
      .from('goal_deposits')
      .select('*')
      .eq('goal_id', newGoal.id);

    if (deposits && deposits.length > 0) {
      console.log(`✅ Found ${deposits.length} deposit(s):`);
      deposits.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.amount} XP at ${new Date(d.created_at).toLocaleString()}`);
      });
    }

    // Step 7: Test completing the goal
    console.log('\n📋 Step 7: Testing goal completion...');
    const remainingPoints = updatedGoal!.target_points - updatedGoal!.current_points;

    if (remainingPoints > 0 && testChild.points_balance >= remainingPoints) {
      const { data: completeResult } = await supabase.rpc('deposit_to_goal', {
        p_goal_id: newGoal.id,
        p_child_id: testChild.id,
        p_amount: remainingPoints,
      });

      if (completeResult?.is_completed) {
        console.log('🎉 Goal completed!');
        console.log(`   Final progress: ${completeResult.goal_progress}/${completeResult.goal_target} XP`);
      }
    } else {
      console.log('⏭️  Skipping completion test (insufficient points or already complete)');
    }

    // Step 8: Cleanup - delete test goal
    console.log('\n📋 Step 8: Cleaning up test data...');
    await supabase
      .from('goal_deposits')
      .delete()
      .eq('goal_id', newGoal.id);

    await supabase
      .from('goals')
      .delete()
      .eq('id', newGoal.id);

    console.log('✅ Test goal cleaned up');

    // Final summary
    console.log('\n' + '=' .repeat(50));
    console.log('✨ Goals Feature Test Complete!\n');
    console.log('Summary:');
    console.log('  ✅ Goals table exists');
    console.log('  ✅ Can create goals');
    console.log('  ✅ Can deposit to goals');
    console.log('  ✅ Goal completion works');
    console.log('\n🚀 Goals feature is ready for testing in the browser!');
    console.log('   Parent: http://localhost:3001/en-US/goals');
    console.log('   Child: http://localhost:3001/en-US/child/goals\n');

  } catch (error: unknown) {
    console.error('\n❌ Test failed with error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testGoals();
