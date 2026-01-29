import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkParentOrChildAuth, verifyChildIdMatch } from '@/lib/api/child-auth';
import { getErrorMessage } from '@/lib/api/error-handler';

/**
 * POST /api/goals/deposit
 * Deposit points to a goal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check for parent auth OR child session
    const authResult = await checkParentOrChildAuth(supabase);
    if (!authResult.success) {
      return authResult.error;
    }

    const { isChildSession, childSessionData, dbClient } = authResult.result;

    // Get authenticated user for parent verification
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { goalId, childId, amount } = body;

    // Validate required fields
    if (!goalId || !childId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: goalId, childId, amount' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // If child session, verify childId matches session
    const mismatchError = verifyChildIdMatch(childId, childSessionData, isChildSession);
    if (mismatchError) return mismatchError;

    // Verify child exists
    const { data: child } = await dbClient
      .from('children')
      .select('id, family_id, points_balance')
      .eq('id', childId)
      .single();

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // For parent auth, verify child belongs to their family
    if (user && !isChildSession) {
      const { data: userProfile } = await dbClient
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!userProfile?.family_id || userProfile.family_id !== child.family_id) {
        return NextResponse.json(
          { error: 'Child not found in your family' },
          { status: 404 }
        );
      }
    }

    // Call the deposit_to_goal RPC function
    const { data: result, error } = await dbClient.rpc('deposit_to_goal', {
      p_goal_id: goalId,
      p_child_id: childId,
      p_amount: amount,
    });

    if (error) {
      console.error('Error depositing to goal:', error);
      return NextResponse.json(
        { error: 'Failed to deposit to goal' },
        { status: 500 }
      );
    }

    // Handle result from RPC
    const depositResult = result as {
      success: boolean;
      error?: string;
      new_balance?: number;
      goal_progress?: number;
      goal_target?: number;
      is_completed?: boolean;
      milestone_reached?: number | null;
      milestone_bonus?: number;
    };

    if (!depositResult.success) {
      return NextResponse.json(
        { error: depositResult.error || 'Deposit failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: depositResult.new_balance,
      goalProgress: depositResult.goal_progress,
      goalTarget: depositResult.goal_target,
      isCompleted: depositResult.is_completed,
      milestoneReached: depositResult.milestone_reached ?? null,
      milestoneBonus: depositResult.milestone_bonus ?? 0,
    });
  } catch (error: unknown) {
    console.error('Goal deposit error:', error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
