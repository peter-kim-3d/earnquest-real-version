import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';
import { authenticateAndGetFamily, errors } from '@/lib/api/responses';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate and get family
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) return authResult.error;
    const { familyId } = authResult;

    const body = await request.json();
    const { rewardId, ...updates } = body;

    if (!rewardId) {
      return errors.missingFields(['rewardId']);
    }

    // Verify reward belongs to user's family
    const { data: existingReward } = await supabase
      .from('rewards')
      .select('id')
      .eq('id', rewardId)
      .eq('family_id', familyId)
      .single();

    if (!existingReward) {
      return errors.notFound('Reward');
    }

    // Update reward
    const { data: reward, error: updateError } = await supabase
      .from('rewards')
      .update(updates)
      .eq('id', rewardId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reward:', updateError);
      return errors.internalError('Failed to update reward');
    }

    return NextResponse.json({
      success: true,
      reward,
      message: 'Reward updated successfully!',
    });
  } catch (error: unknown) {
    console.error('Error in reward update:', error);
    return errors.internalError(getErrorMessage(error));
  }
}
