import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/error-handler';
import { authenticateAndGetFamily, errors } from '@/lib/api/responses';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Authenticate and get family_id
    const authResult = await authenticateAndGetFamily(supabase);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { familyId } = authResult;

    const body = await request.json();
    const { rewardId } = body;

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

    // Soft delete: set deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('rewards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', rewardId);

    if (deleteError) {
      console.error('Error deleting reward:', deleteError);
      return errors.internalError('Failed to delete reward');
    }

    return NextResponse.json({
      success: true,
      message: 'Reward deleted successfully!',
    });
  } catch (error: unknown) {
    console.error('Error in reward deletion:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
