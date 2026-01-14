import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/goals/deposit
 * Deposit points to a goal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get user's family and verify access
    const { data: userProfile } = await supabase
      .from('users')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 404 });
    }

    // Verify child belongs to this family
    const { data: child } = await supabase
      .from('children')
      .select('id, family_id, points_balance')
      .eq('id', childId)
      .eq('family_id', userProfile.family_id)
      .single();

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found in your family' },
        { status: 404 }
      );
    }

    // Call the deposit_to_goal RPC function
    const { data: result, error } = await supabase.rpc('deposit_to_goal', {
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
    });
  } catch (error) {
    console.error('Goal deposit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
