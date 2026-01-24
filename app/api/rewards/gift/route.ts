import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const giftRewardSchema = z.object({
  rewardId: z.string().uuid(),
  childId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check for parent auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const result = giftRewardSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { rewardId, childId, message } = result.data;

    // Call the database RPC function to handle the gift
    const { data, error } = await supabase.rpc('gift_reward', {
      p_reward_id: rewardId,
      p_child_id: childId,
      p_parent_id: user.id,
      p_message: message || null,
    });

    if (error) {
      console.error('Gift reward error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to gift reward' },
        { status: 500 }
      );
    }

    // Check if gift was successful
    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || 'Gift failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reward gifted successfully!',
      purchaseId: data.purchase_id,
      rewardName: data.reward_name,
      childName: data.child_name,
    });
  } catch (error) {
    console.error('Error in reward gift:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
