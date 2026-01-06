'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function purchaseReward(childId: string, rewardId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user's family
    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData?.family_id) {
      return { success: false, error: 'Family not found' };
    }

    // Verify child belongs to user's family and get current points
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id, points_balance')
      .eq('id', childId)
      .eq('family_id', userData.family_id)
      .is('deleted_at', null)
      .single();

    if (!child) {
      return { success: false, error: 'Child not found or unauthorized' };
    }

    // Verify reward belongs to family, is active, and get details
    const { data: reward } = await supabase
      .from('rewards')
      .select('id, family_id, is_active, points_cost, stock_quantity, child_id')
      .eq('id', rewardId)
      .eq('family_id', userData.family_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (!reward) {
      return { success: false, error: 'Reward not found or is no longer available' };
    }

    // Check if reward is assigned to specific child
    if (reward.child_id && reward.child_id !== childId) {
      return { success: false, error: 'This reward is not available for this child' };
    }

    // Check if child has enough points
    if (child.points_balance < reward.points_cost) {
      return {
        success: false,
        error: `Not enough points! Need ${reward.points_cost - child.points_balance} more.`,
      };
    }

    // Check stock availability
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return { success: false, error: 'This reward is out of stock' };
    }

    // Create reward purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('reward_purchases')
      .insert({
        reward_id: rewardId,
        child_id: childId,
        family_id: userData.family_id,
        points_spent: reward.points_cost,
        purchased_at: new Date().toISOString(),
        status: 'purchased',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError);
      return { success: false, error: 'Failed to complete purchase' };
    }

    // Deduct points from child using the database function
    const { error: pointsError } = await supabase.rpc('add_points', {
      p_child_id: childId,
      p_amount: -reward.points_cost, // Negative to deduct
      p_type: 'reward_purchase',
      p_reference_type: 'reward_purchase',
      p_reference_id: purchase.id,
      p_description: `Purchased: ${rewardId}`,
    });

    if (pointsError) {
      console.error('Error deducting points:', pointsError);
      // Try to rollback the purchase
      await supabase.from('reward_purchases').delete().eq('id', purchase.id);
      return { success: false, error: 'Failed to deduct points. Purchase cancelled.' };
    }

    // Update stock quantity if applicable
    if (reward.stock_quantity !== null) {
      const { error: stockError } = await supabase
        .from('rewards')
        .update({ stock_quantity: reward.stock_quantity - 1 })
        .eq('id', rewardId);

      if (stockError) {
        console.error('Error updating stock:', stockError);
        // Don't fail the purchase, just log the error
      }
    }

    // Revalidate store page and dashboard
    revalidatePath('/[locale]/store', 'page');
    revalidatePath('/[locale]/dashboard', 'page');
    revalidatePath('/[locale]/child/[childId]', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error purchasing reward:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
