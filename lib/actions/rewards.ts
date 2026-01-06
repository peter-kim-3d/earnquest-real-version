'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type RewardData = {
  name: string;
  category: string;
  description?: string;
  points_cost: number;
  child_id?: string | null;
  stock_quantity?: number | null;
};

export async function createReward(data: RewardData) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData?.family_id) {
      return { success: false, error: 'Family not found' };
    }

    const { error } = await supabase.from('rewards').insert({
      family_id: userData.family_id,
      ...data,
      is_active: true,
    });

    if (error) {
      console.error('Error creating reward:', error);
      return { success: false, error: 'Failed to create reward' };
    }

    revalidatePath('/[locale]/rewards', 'page');
    revalidatePath('/[locale]/store', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error creating reward:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateReward(rewardId: string, data: Partial<RewardData>) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: reward } = await supabase
      .from('rewards')
      .select('family_id')
      .eq('id', rewardId)
      .single();

    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.family_id !== reward.family_id) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('rewards')
      .update(data)
      .eq('id', rewardId);

    if (error) {
      console.error('Error updating reward:', error);
      return { success: false, error: 'Failed to update reward' };
    }

    revalidatePath('/[locale]/rewards', 'page');
    revalidatePath('/[locale]/store', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating reward:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function toggleRewardActive(rewardId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: reward } = await supabase
      .from('rewards')
      .select('family_id, is_active')
      .eq('id', rewardId)
      .single();

    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.family_id !== reward.family_id) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('rewards')
      .update({ is_active: !reward.is_active })
      .eq('id', rewardId);

    if (error) {
      console.error('Error toggling reward:', error);
      return { success: false, error: 'Failed to toggle reward' };
    }

    revalidatePath('/[locale]/rewards', 'page');
    revalidatePath('/[locale]/store', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error toggling reward:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteReward(rewardId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: reward } = await supabase
      .from('rewards')
      .select('family_id')
      .eq('id', rewardId)
      .single();

    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.family_id !== reward.family_id) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('rewards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', rewardId);

    if (error) {
      console.error('Error deleting reward:', error);
      return { success: false, error: 'Failed to delete reward' };
    }

    revalidatePath('/[locale]/rewards', 'page');
    revalidatePath('/[locale]/store', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting reward:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function fulfillPurchase(purchaseId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: purchase } = await supabase
      .from('reward_purchases')
      .select('family_id, status')
      .eq('id', purchaseId)
      .single();

    if (!purchase) {
      return { success: false, error: 'Purchase not found' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.family_id !== purchase.family_id) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('reward_purchases')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    if (error) {
      console.error('Error fulfilling purchase:', error);
      return { success: false, error: 'Failed to fulfill purchase' };
    }

    revalidatePath('/[locale]/dashboard', 'page');
    revalidatePath('/[locale]/store', 'page');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error fulfilling purchase:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
