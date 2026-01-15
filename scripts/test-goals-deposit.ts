import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('=== Goals Deposit Flow Test ===\n');

  // 1. Get a child with their current balance
  const { data: children } = await supabase
    .from('children')
    .select('id, name, points_balance, family_id')
    .limit(1);

  if (!children || children.length === 0) {
    console.error('❌ No children found');
    return;
  }

  const child = children[0];
  console.log(`📋 Child: ${child.name}`);
  console.log(`💰 Starting balance: ${child.points_balance} XP`);

  // 2. Check for existing goals
  const { data: existingGoals } = await supabase
    .from('goals')
    .select('*')
    .eq('child_id', child.id)
    .eq('is_completed', false);

  let goal;

  if (existingGoals && existingGoals.length > 0) {
    goal = existingGoals[0];
    console.log(`\n🎯 Existing goal: "${goal.name}"`);
    console.log(`   Progress: ${goal.current_points}/${goal.target_points} XP`);
  } else {
    // Create a test goal
    console.log('\n📝 Creating test goal...');
    const { data: newGoal, error: createError } = await supabase
      .from('goals')
      .insert({
        child_id: child.id,
        family_id: child.family_id,
        name: 'Test Goal - LEGO Set',
        description: 'Save up for a cool LEGO set',
        target_points: 500,
        current_points: 0,
        tier: 'large',
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create goal:', createError.message);
      return;
    }
    goal = newGoal;
    console.log(`✅ Created goal: "${goal.name}" (target: ${goal.target_points} XP)`);
  }

  // 3. Ensure child has enough points for deposit
  const depositAmount = 50;
  if (child.points_balance < depositAmount) {
    console.log(`\n⚠️ Child has insufficient balance. Adding ${depositAmount * 2} XP...`);
    await supabase
      .from('children')
      .update({ points_balance: depositAmount * 2 })
      .eq('id', child.id);
    child.points_balance = depositAmount * 2;
    console.log(`✅ Balance updated to: ${child.points_balance} XP`);
  }

  // Store original values for verification
  const originalBalance = child.points_balance;
  const originalProgress = goal.current_points;

  // 4. Test the deposit via RPC function directly
  console.log(`\n💸 Depositing ${depositAmount} XP to goal via RPC...`);

  const { data: result, error: depositError } = await supabase.rpc('deposit_to_goal', {
    p_goal_id: goal.id,
    p_child_id: child.id,
    p_amount: depositAmount,
  });

  if (depositError) {
    console.error('❌ Deposit RPC failed:', depositError.message);
    return;
  }

  const depositResult = result as {
    success: boolean;
    error?: string;
    new_balance?: number;
    goal_progress?: number;
    goal_target?: number;
    is_completed?: boolean;
  };

  if (!depositResult.success) {
    console.error('❌ Deposit failed:', depositResult.error);
    return;
  }

  console.log('✅ Deposit successful!');
  console.log(`   New balance: ${depositResult.new_balance} XP`);
  console.log(`   Goal progress: ${depositResult.goal_progress}/${depositResult.goal_target} XP`);
  console.log(`   Is completed: ${depositResult.is_completed}`);

  // 5. Verify in database
  console.log('\n📊 Verifying in database...');

  const { data: updatedChild } = await supabase
    .from('children')
    .select('points_balance')
    .eq('id', child.id)
    .single();

  const { data: updatedGoal } = await supabase
    .from('goals')
    .select('current_points, is_completed')
    .eq('id', goal.id)
    .single();

  const { data: deposits } = await supabase
    .from('goal_deposits')
    .select('*')
    .eq('goal_id', goal.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('child_id', child.id)
    .eq('type', 'goal_deposit')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log(`   Child balance in DB: ${updatedChild?.points_balance} XP`);
  console.log(`   Goal progress in DB: ${updatedGoal?.current_points} XP`);
  console.log(`   Latest deposit record: ${deposits?.[0]?.amount || 'NOT FOUND'} XP`);
  console.log(`   Transaction record: ${transactions?.[0]?.amount || 'NOT FOUND'} XP`);

  // 6. Validation
  console.log('\n=== Validation ===');
  const expectedBalance = originalBalance - depositAmount;
  const expectedProgress = originalProgress + depositAmount;

  const balanceCorrect = updatedChild?.points_balance === expectedBalance;
  const progressCorrect = updatedGoal?.current_points === expectedProgress;
  const depositRecorded = deposits && deposits.length > 0 && deposits[0].amount === depositAmount;
  const transactionRecorded = transactions && transactions.length > 0;

  console.log(`${balanceCorrect ? '✅' : '❌'} Balance deducted correctly (expected: ${expectedBalance}, got: ${updatedChild?.points_balance})`);
  console.log(`${progressCorrect ? '✅' : '❌'} Goal progress updated (expected: ${expectedProgress}, got: ${updatedGoal?.current_points})`);
  console.log(`${depositRecorded ? '✅' : '❌'} Deposit record created`);
  console.log(`${transactionRecorded ? '✅' : '❌'} Transaction record created`);

  if (balanceCorrect && progressCorrect && depositRecorded && transactionRecorded) {
    console.log('\n🎉 All tests passed! Goals deposit flow is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }

  // 7. Test insufficient balance
  console.log('\n=== Testing insufficient balance ===');
  const { data: insufficientResult } = await supabase.rpc('deposit_to_goal', {
    p_goal_id: goal.id,
    p_child_id: child.id,
    p_amount: 10000, // More than balance
  });

  const insufficientData = insufficientResult as { success: boolean; error?: string };
  if (!insufficientData.success && insufficientData.error?.includes('Insufficient')) {
    console.log('✅ Correctly rejected deposit with insufficient balance');
  } else {
    console.log('❌ Should have rejected deposit with insufficient balance');
  }
}

main().catch(console.error);
