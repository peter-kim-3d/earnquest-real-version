import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkParentOrChildAuth, verifyChildIdMatch } from '@/lib/api/child-auth';
import { getErrorMessage } from '@/lib/api/error-handler';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check for parent auth OR child session
    const authResult = await checkParentOrChildAuth(supabase);
    if (!authResult.success) {
      return authResult.error;
    }

    const { isChildSession, childSessionData, dbClient } = authResult.result;

    const body = await request.json();
    const { rewardId, childId } = body;

    if (!rewardId || !childId) {
      return NextResponse.json(
        { error: 'Missing rewardId or childId' },
        { status: 400 }
      );
    }

    // If child session, verify childId matches session
    const mismatchError = verifyChildIdMatch(childId, childSessionData, isChildSession);
    if (mismatchError) return mismatchError;

    // Use the database RPC function to handle the purchase
    const { data, error } = await dbClient.rpc('purchase_reward', {
      p_reward_id: rewardId,
      p_child_id: childId,
    });

    if (error) {
      console.error('Purchase error:', error);

      // Handle specific error cases
      if (error.message.includes('Insufficient points')) {
        return NextResponse.json(
          { error: 'You need more Quest Points to purchase this reward!' },
          { status: 400 }
        );
      }

      if (error.message.includes('Weekly limit reached')) {
        return NextResponse.json(
          { error: 'You\'ve already purchased this reward the maximum times this week!' },
          { status: 400 }
        );
      }

      if (error.message.includes('Screen budget exceeded')) {
        return NextResponse.json(
          { error: 'You\'ve used all your screen time this week. Try other rewards!' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to purchase reward' },
        { status: 500 }
      );
    }

    // Check if purchase was successful
    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || 'Purchase failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reward purchased successfully!',
      newBalance: data.new_balance,
      purchaseId: data.purchase_id,
    });
  } catch (error: unknown) {
    console.error('Error in reward purchase:', error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
