import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
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
    const { rewardId, ...updates } = body;

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

    // Update reward
    const { data: reward, error: updateError } = await supabase
      .from('rewards')
      .update(updates)
      .eq('id', rewardId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reward:', updateError);
      return NextResponse.json(
        { error: 'Failed to update reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reward,
      message: 'Reward updated successfully!',
    });
  } catch (error) {
    console.error('Error in reward update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
