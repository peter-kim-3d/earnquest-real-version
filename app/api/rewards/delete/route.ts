import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's family
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Missing rewardId' },
        { status: 400 }
      );
    }

    // Verify reward belongs to user's family
    const { data: existingReward } = await supabase
      .from('rewards')
      .select('id')
      .eq('id', rewardId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (!existingReward) {
      return NextResponse.json(
        { error: 'Reward not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete: set deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('rewards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', rewardId);

    if (deleteError) {
      console.error('Error deleting reward:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reward deleted successfully!',
    });
  } catch (error) {
    console.error('Error in reward deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
